import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Input from "./Input";
import Button from "./Botão";
import uniqid from "uniqid";
import toast from "react-hot-toast";

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
  const saveFileLocally = (values: FieldValues) => {
    const songFile = values.song?.[0];
    const imageFile = values.image?.[0];

    if (!values.title || !values.author || !songFile || !imageFile) {
      toast.error("Todos os campos são obrigatórios.");
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

        // Upload song file
        const { data: songData, error: songError } = await supabaseClient
          .storage
          .from("musicas")
          .upload(`musica-${file.title}-${uniqueID}`, file.song, {
            cacheControl: "3600",
            upsert: false,
          });

        if (songError) throw new Error("Erro ao enviar a música.");

        // Upload image file
        const { data: imageData, error: imageError } = await supabaseClient
          .storage
          .from("imagens")
          .upload(`imagem-${file.title}-${uniqueID}`, file.image, {
            cacheControl: "3600",
            upsert: false,
          });

        if (imageError) throw new Error("Erro ao enviar a imagem.");

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

        if (supabaseError) throw new Error("Erro ao salvar os dados no banco.");
      }

      toast.success("Todos os arquivos foram enviados com sucesso!");
      setLocalFiles([]); // Clear local storage after upload
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro inesperado ao enviar arquivos.");
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
          accept=".mp3"
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
