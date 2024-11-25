'use client'
import Modal from "./Modal";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import {   useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import usePlaylistModal from "@/hooks/usePlaylistModal";
import { Playlist, Song } from "@/types";
import AddSongToPlaylistModal from "@/app/playlists/[id]/AddSongsToPlaylist";
import Button from "./Botão";


interface PlaylistModalProps {
    playlistId: Playlist['id']
    songId: Song['id'];
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
    playlistId,
    songId
}) => {
    
    const playlistModal = usePlaylistModal();
    const supabaseClient = useSupabaseClient();
    const [selectedFile, setSelectedFile] = useState();
    const [checkFile, setCheckFile] = useState(false);
    const { user} = useUser();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const user_id = user?.id
    


    



    const handleSubmit = async () =>{

    
      const { error, data } = await supabaseClient.from('Playlists').insert([{ title, description, user_id, songId }]);
      

      if (error){
        
       console.log('Error creating playlist:', error);
      } 
      else 
      {
      return (data as any) || [];
      
      };      



    };

    const imageHandler = (e: any) => {
        setSelectedFile(e.target.files[0]);
        setCheckFile(true);
    }

    const imagesubmission = () => {
        if (checkFile) {
            alert("File Uploaded");
            console.log(selectedFile);
        } else {
            alert("select a file");
        }
    }

    const {
        reset
    } = useForm<FieldValues>()
    

    const onChange = (open: boolean) => {
        if (!open) {
            reset();
   
            playlistModal.onClose()
        }
    }
    
    return (
        <Modal 
         title="Criar uma nova lista de reprodução 📝"
         description='Escolha as músicas e cria tua própria lista de reprodução! 🏃🏾'
         isOpen = {playlistModal.isOpen}
         onChange={onChange}
        >
           <form className="
            flex-col justify-items-center p-2 m-auto
           ">
            <div className="flex-col justify-items-center p-3 m-0 w-full"> 


            <div className="h-9 m-auto">
                
            
              <input className="h-7 m-auto w-full"
               required
               type="text"
               placeholder="title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               />
             </div>

            
            <div className="h-7 m-auto">
             <input className="h-7 w-full"
             placeholder="Description"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             />


            </div>

            </div>

    
           

            <AddSongToPlaylistModal playlistId={playlistId} />

           <Button onClick={handleSubmit} > Criar Playlist </Button>

         </form>
        </Modal>
    )
}

export default PlaylistModal;
