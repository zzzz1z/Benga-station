import useUploadModal from "@/hooks/useUploadModal";
import Modal from "./Modal";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import Input from "./Input";
import Button from "./Botão";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";
import uniqid from 'uniqid'
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

const UploadModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const uploadModal = useUploadModal();
    const { user } = useUser();
    const supabaseClient = useSupabaseClient();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset
    } = useForm<FieldValues>({
        defaultValues: {
            author: '',
            title: '',
            song: null,
            image: null,
        }
    })
    

    const onChange = (open: boolean) => {
        if (!open) {
            reset();
   
            uploadModal.onClose()
        }
    }

    const onSubmit: SubmitHandler<FieldValues> = async (values) => {
        try {
            setIsLoading(true);

            const imageFile = values.image?.[0];
            const songFile = values.song?.[0];

            if ( !imageFile || !songFile || !user) {
             toast.error('wawe coisa');
             return;
        

            }

            const uniqueID = uniqid();


            const {
                data: songData,
                error: songError,
            } = await supabaseClient.storage.from('musicas').upload(`musica-${values.title}-${uniqueID}`, songFile, {
                cacheControl: '3600',
                upsert: false
            });
            
            if (songError){
                console.log(songError)
                setIsLoading(false);
                return toast.error('Deu bum 1 , tenta de novo');
            }

            const {
                data: imageData,
                error: imageError,
            } = await supabaseClient.storage.from('imagens').upload(`imagem-${values.title}-${uniqueID}`, imageFile, {
                cacheControl: '3600',
                upsert: false
            });

            

            if (imageError){
                setIsLoading(false);
                return toast.error('Deu bum 2 , tenta de novo');
            }


            const {
                error: supabaseError
            } = await supabaseClient.from('Songs').insert({
                user_id: values.user_id,
                title: values.title,
                author: values.author,
                image_path: imageData.path,
                song_path: songData.path

            })

            if (supabaseError) {
                return toast.error('deu bum 3 , tenta de novo');

            }

            router.refresh();
            setIsLoading(false);
            toast.success('Música criada');
            reset();
            uploadModal.onClose();


        } catch (error) {
            toast.error('deu bum')

        } finally {
            setIsLoading(false)
        }

    }
    
    return (
        <Modal 
         title="Adicionar uma música"
         description='Carregar ficheiro'
         isOpen = {uploadModal.isOpen}
         onChange={onChange}
        >
            <form
             onSubmit={handleSubmit(onSubmit)}
             className="flex flex-col gap-y-4"
            >
                <Input
                 id="title"
                 disabled={isLoading}
                 {...register('title', { required: true })}
                 placeholder="Título da música"
                />

                <Input
                 id="author"
                 disabled={isLoading}
                 {...register('author', { required: true })}
                 placeholder="Autor da música"
                />
                

                <div>
                    
                    <div className="pb-1">
                        Escolha um ficheiro de audio
                    </div>

                    <Input 
                     id='song'
                     type= 'file'
                     disabled={isLoading}
                     accept=".mp3"
                     {...register('song', { required: true })}
                     
                    />
                    
                    
                </div>
                
                
                
                


                

                    
                
                <div>
                    <div className="pb-1">
                        Escolhe uma imagem    
                    </div>



                    <Input 
                       id='image'
                       type= 'file'
                       disabled={isLoading}
                       accept="image/*"
                       {...register('image', { required: true })}
                     
                    />
                    

                    
                </div>
                 
                <Button disabled={isLoading} type="submit">
                 Submeter Música
                </Button>


                

            </form>
        </Modal>
    )
}

export default UploadModal;
