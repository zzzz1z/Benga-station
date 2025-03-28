"use client"

import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { twMerge } from "tailwind-merge";
import useAuthModal from "@/hooks/useAuthModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/hooks/useUser";
import Button from "./Botão";
import { FaUserAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import usePlayer from "@/hooks/usePlayer";
import { SlPlaylist } from "react-icons/sl";
import { FcLike } from "react-icons/fc";
import useUploadModal from "@/hooks/useUploadModal";
import { AiOutlineFileAdd } from "react-icons/ai";


interface HeaderProps{
    children: React.ReactNode;
    className?: string;
}
const Header: React.FC <HeaderProps> = ({
    children,
    className
}) =>  {

    const router = useRouter();
    const authModal = useAuthModal();
    const player = usePlayer();
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const uploadModal = useUploadModal()


    const onClick = () => {

      if(!user){
        return authModal.onOpen('sign_up')
      }

      return uploadModal.onOpen()
      
    }


    const handleLogout = async () => {
      const {error} = await supabaseClient.auth.signOut();

      player.reset();

      router.refresh();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Tas off!')
      }

    }
  return (
    <div
    className={twMerge(`
    h-fit
    bg-gradient-to-b 
    from-red-800
    p-6`,
    className
    )}
    >
     <div className="
        w-full
        mb-4
        flex
        items-center
        justify-between
        "
     >
        <div className="
          hidden
          md:flex
          gap-x-2
          items-center
          "
        >
         <button
          onClick={()=> router.back()} 
          className="
          rounded-full
        bg-black
          flex
          items-center
          justify-center
          hover:opacity-75
          transition
          "
        >
          <RxCaretLeft 
          className="text-white" size={35}
          />

        </button>
    
    
        <button 
          onClick={()=> router.forward()} 
          className="
          rounded-full
          bg-black
          flex
          items-center
          justify-center
          hover:opacity-75
          transition
          "
          >
              <RxCaretRight 
              className="text-white" size={35}
              />

        </button>   



        </div>



        <div className="flex md:hidden gap-x-2 items-center">

          <button
            // redirecionar para pagina inicial
            onClick={()=> router.push('/')}
            className="
            rounded-full
            p-2
          bg-white
            flex
            items-center
            justify-center
            hover:opacity-75transition
            ">
            <HiHome className="text-black" size={20}/>
          </button>





          <button
            // redirecionar para pagina de pesquisa
          onClick={()=> router.push('/search')}
          className="
          rounded-full
          p-2
        bg-white
          flex
          items-center
          justify-center
          hover:opacity-75transition
          ">
            <BiSearch className="text-black" size={20}/>
          </button> 

          

          <button
            // add songs
          onClick={onClick}
          className="
          rounded-full
          p-2
        bg-white
          flex
          items-center
          justify-center
          hover:opacity-75transition
          ">
            <AiOutlineFileAdd className="text-black" size={20}/>
          </button> 





        </div>



        <div 
         className="
         flex
         justify-between
         items-center
         gap-x-4
         "
        >




          {user ? (
           <>

            <div className="flex md:hidden gap-x-2 items-center">


            <button
            // redirecionar para pagina de pesquisa
              onClick={()=> router.push('/playlists')}
              className="
              rounded-full
              p-2
              bg-white
              flex
              items-center
              justify-center
              hover:opacity-75transition
            ">
              <SlPlaylist className="text-black" size={20}/>
            </button> 

            <button
            // redirecionar para pagina de pesquisa
              onClick={()=> router.push('/liked')}
              className="
              rounded-full
              p-2
              bg-white
              flex
              items-center
              justify-center
              hover:opacity-75transition
              ">
              <FcLike className="text-black" size={20}/>
            </button>  
            </div>
            



            <div className="flex gap-x-4 items-center">

            
            <Button
              onClick={()=> router.push('/account')}
              className="bg-white"
            >
              <FaUserAlt/>

            </Button>





            <Button
              onClick={handleLogout}
              className="bg-white px-6 py-2"
            >
                Sair  
              
            </Button>



              

              

           

            </div>
          </>




          ) 
          
          :
          
          ( 

          <>

            <div>
            <Button
            onClick={() => authModal.onOpen("sign_up")} // 👈 Opens in sign-up mode
            className="bg-transparent text-neutral-300 font-medium"
            >
              Criar conta    
            </Button>
            </div>

            <div>
            <Button
            onClick={() => authModal.onOpen("sign_in")} // 👈 Opens in sign-in mode
            className="bg-red-700 px-6 py-2"
            >
              Iniciar sessão    
            </Button>
            </div>

            </>
            )}
        </div> 
     </div> 
     {children}    
    </div>
  )
}

export default Header
