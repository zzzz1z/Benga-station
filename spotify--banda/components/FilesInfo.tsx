import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Input from "../app/search/components/Input";
import Button from "./Botão";
import uniqid from "uniqid";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { markDataStale } from "./FloatingRefreshButton";
import { authedFetch } from "@/utils/api";

const supabase = createClient();

const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9-_]/g, "_");

const isValidAudioFile = async (file: File) => {
  const validMimeTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac"];
  const validExtensions = [".mp3", ".wav", ".ogg", ".flac"];
  const isValidMime = validMimeTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  try {
    const arrayBuffer = await file.slice(0, 4).arrayBuffer();
    const header = new Uint8Array(arrayBuffer).join(" ");
    const magicNumbers: Record<string, string> = {
      mp3: "255 251", wav: "82 73 70 70", ogg: "79 103 103 83", flac: "102 76 97 67",
    };
    const matchesHeader = Object.values(magicNumbers).some((sig) => header.startsWith(sig));
    return isValidMime || hasValidExtension || matchesHeader;
  } catch {
    return isValidMime || hasValidExtension;
  }
};

interface LocalFile {
  title: string;
  author: string;
  song: File;
  image: File;
}

const FilesInfo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const { user } = useUser();

  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: { author: "", title: "", song: null, image: null },
  });

  const saveFileLocally = async (values: FieldValues) => {
    const songFile = values.song?.[0] as File;
    const originalImage = values.image?.[0] as File;

    if (!values.title || !values.author || !songFile || !originalImage) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    if (!(await isValidAudioFile(songFile))) {
      toast.error("Formato de áudio não suportado.");
      return;
    }

    let compressedImage: File;
    try {
      compressedImage = await imageCompression(originalImage, {
        maxSizeMB: 1, maxWidthOrHeight: 512, useWebWorker: true, fileType: "image/jpeg",
      });
    } catch (err) {
      console.error("Image compression error:", err);
      toast.error("Erro ao processar a imagem.");
      return;
    }

    setLocalFiles((prev) => [...prev, { title: values.title, author: values.author, song: songFile, image: compressedImage }]);
    toast.success("Arquivo salvo localmente.");
    reset();
  };

const uploadSingleFile = async (file: LocalFile): Promise<{ success: boolean; title: string }> => {
    const uniqueID = uniqid();
    const safeTitle = sanitizeFilename(file.title);

    try {
      const [songResult, imageResult] = await Promise.all([
        supabase.storage
          .from("musicas")
          .upload(`musica-${safeTitle}-${uniqueID}.mp3`, file.song, { cacheControl: "3600", upsert: false }),
        supabase.storage
          .from("imagens")
          .upload(`imagem-${safeTitle}-${uniqueID}.jpg`, file.image, { cacheControl: "3600", upsert: false }),
      ]);

      if (songResult.error) throw songResult.error;
      if (imageResult.error) {
        await supabase.storage.from("musicas").remove([songResult.data.path]);
        throw imageResult.error;
      }

      const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`, {
        method: 'POST',
        body: JSON.stringify({
          title: file.title,
          author: file.author,
          image_path: imageResult.data.path,
          song_path: songResult.data.path,
        }),
      });

      if (!res.ok) {
        await Promise.all([
          supabase.storage.from("musicas").remove([songResult.data.path]),
          supabase.storage.from("imagens").remove([imageResult.data.path]),
        ]);
        throw new Error('DB insert failed');
      }

      return { success: true, title: file.title };
    } catch (error: any) {
      console.error(`Erro ao enviar "${file.title}":`, error.message);
      return { success: false, title: file.title };
    }
  };

  const uploadToDatabase = async () => {
    if (localFiles.length === 0) {
      toast.error("Nenhum arquivo para enviar.");
      return;
    }

    setIsLoading(true);
    const total = localFiles.length;

    const results = await Promise.allSettled(localFiles.map(uploadSingleFile));

    const failed = results
      .map((r) => (r.status === 'fulfilled' ? r.value : { success: false, title: 'unknown' }))
      .filter((r) => !r.success)
      .map((r) => r.title);

    const succeeded = total - failed.length;

    setIsLoading(false);

    if (failed.length === 0) {
      toast.success(`${total} música${total > 1 ? 's' : ''} enviada${total > 1 ? 's' : ''} com sucesso!`);
      setLocalFiles([]);
      markDataStale();
      
     
    } else if (succeeded > 0) {
      toast.success(`${succeeded} enviada${succeeded > 1 ? 's' : ''} com sucesso.`);
      toast.error(`Falhou: ${failed.join(', ')}`);
      setLocalFiles((prev) => prev.filter((f) => failed.includes(f.title)));
      markDataStale();

     
    } else {
      toast.error("Todos os uploads falharam.");
    }
  };

  return (
    <div className="flex flex-col gap-y-3">
      <form onSubmit={handleSubmit(saveFileLocally)} className="flex flex-col gap-y-2">
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-neutral-400 font-medium">Título</label>
          <Input id="title" disabled={isLoading} {...register("title", { required: true })} placeholder="Título da música" />
        </div>
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-neutral-400 font-medium">Artista</label>
          <Input id="author" disabled={isLoading} {...register("author", { required: true })} placeholder="Autor da música" />
        </div>
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-neutral-400 font-medium">Ficheiro de música</label>
          <Input id="song" type="file" accept=".mp3,.wav,.ogg,.flac,audio/*" disabled={isLoading} {...register("song", { required: true })} />
        </div>
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-neutral-400 font-medium">Capa</label>
          <Input id="image" type="file" accept="image/*" disabled={isLoading} {...register("image", { required: true })} />
        </div>
        <Button disabled={isLoading} type="submit" className="mt-1">
          Salvar Localmente
        </Button>
      </form>

      {localFiles.length > 0 && (
        <div className="border-t border-neutral-700 pt-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
            Ficheiros prontos ({localFiles.length})
          </h3>
          <ul className="flex flex-col gap-y-1 mb-3">
            {localFiles.map((file, i) => (
              <li key={i} className="flex items-center gap-x-2 text-sm text-neutral-300">
                <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                <span className="truncate">{file.title}</span>
                <span className="text-neutral-500 flex-shrink-0">— {file.author}</span>
              </li>
            ))}
          </ul>
          <Button onClick={uploadToDatabase} disabled={isLoading}>
            {isLoading ? "A enviar..." : `Fazer Upload (${localFiles.length})`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilesInfo;