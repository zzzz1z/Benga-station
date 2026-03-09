import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Input from "./Input";
import Button from "./Botão";
import uniqid from "uniqid";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
      // Upload song and image in parallel
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
        // Clean up song if image failed
        await supabase.storage.from("musicas").remove([songResult.data.path]);
        throw imageResult.error;
      }

      const { error: dbError } = await supabase.from("Songs").insert({
        user_id: user?.id,
        title: file.title,
        author: file.author,
        image_path: imageResult.data.path,
        song_path: songResult.data.path,
      });

      if (dbError) {
        // Clean up both if DB insert failed
        await Promise.all([
          supabase.storage.from("musicas").remove([songResult.data.path]),
          supabase.storage.from("imagens").remove([imageResult.data.path]),
        ]);
        throw dbError;
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

    // Upload all files in parallel
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
      router.refresh();
    } else if (succeeded > 0) {
      toast.success(`${succeeded} enviada${succeeded > 1 ? 's' : ''} com sucesso.`);
      toast.error(`Falhou: ${failed.join(', ')}`);
      setLocalFiles((prev) => prev.filter((f) => failed.includes(f.title)));
      router.refresh();
    } else {
      toast.error("Todos os uploads falharam.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(saveFileLocally)} className="flex flex-col gap-y-4">
        <h2>Título da música:</h2>
        <Input id="title" disabled={isLoading} {...register("title", { required: true })} placeholder="Título da música" />
        <h2>Nome do artista:</h2>
        <Input id="author" disabled={isLoading} {...register("author", { required: true })} placeholder="Autor da música" />
        <h2>Selecione um ficheiro de música:</h2>
        <Input id="song" type="file" accept=".mp3,.wav,.ogg,.flac,audio/*" disabled={isLoading} {...register("song", { required: true })} />
        <h2>Capa:</h2>
        <Input id="image" type="file" accept="image/*" disabled={isLoading} {...register("image", { required: true })} />
        <Button disabled={isLoading} type="submit">Salvar Localmente</Button>
      </form>

      {localFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-4">Arquivos salvos localmente:</h3>
          <ul className="list-disc pl-6">
            {localFiles.map((file, i) => (
              <li key={i}>
                <p><strong>Título:</strong> {file.title}</p>
                <p><strong>Autor:</strong> {file.author}</p>
              </li>
            ))}
          </ul>
          <Button onClick={uploadToDatabase} disabled={isLoading} className="mt-4">
            {isLoading ? "Enviando..." : "Fazer Upload"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilesInfo;