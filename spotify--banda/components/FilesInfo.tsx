import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Input from "./Input";
import Button from "./Botão";
import uniqid from "uniqid";
import toast from "react-hot-toast";

// Sanitize file names
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9-_]/g, "_");

// Validate file format
const isValidAudioFile = async (file: File) => {
  const validMimeTypes = [
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac"
  ];
  const validExtensions = [".mp3", ".wav", ".ogg", ".flac"];

  const isValidMime = validMimeTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  try {
    const arrayBuffer = await file.slice(0, 4).arrayBuffer();
    const header = new Uint8Array(arrayBuffer).join(" ");

    const magicNumbers = {
      mp3: "255 251",
      wav: "82 73 70 70",
      ogg: "79 103 103 83",
      flac: "102 76 97 67"
    };

    const matchesHeader = Object.values(magicNumbers).some(signature =>
      header.startsWith(signature)
    );

    return isValidMime || hasValidExtension || matchesHeader;
  } catch {
    return isValidMime || hasValidExtension;
  }
};

const FilesInfo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [localFiles, setLocalFiles] = useState<any[]>([]);
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();

  const { register, handleSubmit, reset } = useForm<FieldValues>({
    defaultValues: {
      author: "",
      title: "",
      song: null,
      image: null,
    },
  });

  const saveFileLocally = async (values: FieldValues) => {
    const songFile = values.song?.[0];
    const imageFile = values.image?.[0];

    if (!values.title || !values.author || !songFile || !imageFile) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    if (!(await isValidAudioFile(songFile))) {
      toast.error("Formato de áudio não suportado.");
      return;
    }

    setLocalFiles(prev => [
      ...prev,
      {
        title: values.title,
        author: values.author,
        song: songFile,
        image: imageFile,
      },
    ]);

    toast.success("Arquivo salvo localmente.");
    reset();
  };

  const uploadToDatabase = async () => {
    if (localFiles.length === 0) {
      toast.error("Nenhum arquivo para enviar.");
      return;
    }

    setIsLoading(true);

    try {
      for (const file of localFiles) {
        const uniqueID = uniqid();
        const safeTitle = sanitizeFilename(file.title);

        const { data: songData, error: songError } = await supabaseClient
          .storage
          .from("musicas")
          .upload(`musica-${safeTitle}-${uniqueID}.mp3`, file.song, {
            cacheControl: "3600",
            upsert: false,
          });

        if (songError) {
          console.error("Erro ao enviar música:", songError);
          throw new Error(`Erro ao enviar a música: ${file.song.name}`);
        }

        const { data: imageData, error: imageError } = await supabaseClient
          .storage
          .from("imagens")
          .upload(`imagem-${safeTitle}-${uniqueID}`, file.image, {
            cacheControl: "3600",
            upsert: false,
          });

        if (imageError) {
          console.error("Erro ao enviar imagem:", imageError);
          throw new Error(`Erro ao enviar a imagem: ${file.image.name}`);
        }

        const { error: dbError } = await supabaseClient
          .from("Songs")
          .insert({
            user_id: user?.id,
            title: file.title,
            author: file.author,
            image_path: imageData?.path,
            song_path: songData?.path,
          });

        if (dbError) {
          console.error("Erro ao salvar no banco:", dbError);
          throw new Error(`Erro ao salvar no banco: ${file.title}`);
        }
      }

      toast.success("Todos os arquivos foram enviados com sucesso!");
      setLocalFiles([]);
    } catch (error: any) {
      console.error("Erro geral:", error.message);
      toast.error("Erro no upload dos ficheiros.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(saveFileLocally)}
        className="flex flex-col gap-y-4"
      >
        <h2>Título da música:</h2>
        <Input
          id="title"
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="Título da música"
        />

        <h2>Nome do artista:</h2>
        <Input
          id="author"
          disabled={isLoading}
          {...register("author", { required: true })}
          placeholder="Autor da música"
        />

        <h2>Selecione um ficheiro de música:</h2>
        <Input
          id="song"
          type="file"
          accept=".mp3,.wav,.ogg,.flac,audio/*"
          disabled={isLoading}
          {...register("song", { required: true })}
        />

        <h2>Capa:</h2>
        <Input
          id="image"
          type="file"
          accept="image/*"
          disabled={isLoading}
          {...register("image", { required: true })}
        />

        <Button disabled={isLoading} type="submit">
          Salvar Localmente
        </Button>
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
          <Button
            onClick={uploadToDatabase}
            disabled={isLoading}
            className="mt-4"
          >
            Fazer Upload
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilesInfo;
