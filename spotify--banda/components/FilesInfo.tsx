import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Input from "./Input";
import Button from "./Botão";
import uniqid from "uniqid";
import toast from "react-hot-toast";

// Function to sanitize file names (remove special characters)
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9-_]/g, "_");

// Function to validate file format
const isValidAudioFile = async (file: File) => {
  const validMimeTypes = [
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac"
  ];

  const arrayBuffer = await file.slice(0, 4).arrayBuffer();
  const header = new Uint8Array(arrayBuffer).join(" ");

  // Check for common audio file headers
  const magicNumbers = {
    mp3: "255 251", // MP3 file magic numbers
    wav: "82 73 70 70", // WAV file magic numbers
    ogg: "79 103 103 83", // OGG file magic numbers
    flac: "102 76 97 67" // FLAC file magic numbers
  };

  const isValidFormat = Object.values(magicNumbers).some(signature =>
    header.startsWith(signature)
  );

  return validMimeTypes.includes(file.type) || isValidFormat;
};

const FilesInfo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [localFiles, setLocalFiles] = useState<any[]>([]); // Temporarily store files
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

  // Save file details locally
  const saveFileLocally = async (values: FieldValues) => {
    const songFile = values.song?.[0];
    const imageFile = values.image?.[0];

    if (!values.title || !values.author || !songFile || !imageFile) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    // Check if the audio file format is valid
    if (!(await isValidAudioFile(songFile))) {
      toast.error("Formato de áudio não suportado.");
      return;
    }

    setLocalFiles((prev) => [
      ...prev,
      {
        title: values.title,
        author: values.author,
        song: songFile,
        image: imageFile,
      },
    ]);

    toast.success("Arquivo salvo localmente.");
    reset(); // Reset form fields
  };

  // Upload all files in localFiles to Supabase
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

        // Upload song file
        const { data: songData, error: songError } = await supabaseClient
          .storage
          .from("musicas")
          .upload(`musica-${safeTitle}-${uniqueID}.mp3`, file.song, {
            cacheControl: "3600",
            upsert: false,
          });

        if (songError) {
          console.error("Erro ao enviar a música:", file.song.name, songError);
          throw new Error(`Erro ao enviar a música: ${file.song.name}`);
        }

        // Upload image file
        const { data: imageData, error: imageError } = await supabaseClient
          .storage
          .from("imagens")
          .upload(`imagem-${safeTitle}-${uniqueID}`, file.image, {
            cacheControl: "3600",
            upsert: false,
          });

        if (imageError) {
          console.error("Erro ao enviar a imagem:", file.image.name, imageError);
          throw new Error(`Erro ao enviar a imagem: ${file.image.name}`);
        }

        // Insert metadata into the database
        const { error: supabaseError } = await supabaseClient
          .from("Songs")
          .insert({
            user_id: user?.id,
            title: file.title,
            author: file.author,
            image_path: imageData?.path,
            song_path: songData?.path,
          });

        if (supabaseError) {
          console.error("Erro ao salvar no banco:", file.title, supabaseError);
          throw new Error(`Erro ao salvar no banco: ${file.title}`);
        }
      }

      toast.success("Todos os arquivos foram enviados com sucesso!");
      setLocalFiles([]);
    } catch (error: any) {
      console.error("Operação falhada:", error.message);
      toast.error("Operação falhada, não é possível fazer upload do seu ficheiro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Form to save file details locally */}
      <form
        onSubmit={handleSubmit(saveFileLocally)}
        className="flex flex-col gap-y-4"
      >
        <Input
          id="title"
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="Título da música"
        />
        <Input
          id="author"
          disabled={isLoading}
          {...register("author", { required: true })}
          placeholder="Autor da música"
        />
        <Input
          id="song"
          type="file"
          accept="audio/*"
          disabled={isLoading}
          {...register("song", { required: true })}
        />
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

      {/* Display local files */}
      <div className="mt-6">
        {localFiles.length > 0 && (
          <div>
            <h3 className="font-bold mb-4">Arquivos salvos localmente:</h3>
            <ul className="list-disc pl-6">
              {localFiles.map((file, index) => (
                <li key={index}>
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
    </div>
  );
};

export default FilesInfo;
