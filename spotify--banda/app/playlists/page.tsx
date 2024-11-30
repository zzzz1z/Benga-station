import Header from "@/components/Header";
import LikedContent from "./components/LikedContent";
import Image from "next/image";
import getPlaylistsByUserId from "@/actions/getPlaylistsByUserId";
import Button from "@/components/Botão";



export const revalidate = 0;

const Liked = async () => {

 
  const playlist = await getPlaylistsByUserId();



  return (
    <div className="
    bg-neutral-900
    rounded-lg
    h-full
    w-full
    overflow-hidden
    overflow-y-auto"
    >
     <Header>
        <div className="mt20">
            <div
             className="
             flex
             flex-col
             md:flex-row
             items-center
             gap-x-5
             "
            >
                <div
                className="
                relative
                h-32
                w-32
                lg:h-44
                lg:w-44"
                >
                    <Image
                     fill
                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                     alt='Lista de Músicas'
                     className="object-cover"
                     src='/images/likedit.png'
                     
                    />

                </div>
                <div className="
                flex
                flex-col
                gap-y-2
                mt-4
                md:mt-0"
                >
                    <p className="hidden md:block font-semibold text-sm">
                        🔊 🔊 🔊 🔊 
                    </p>
                    <h1
                    className="
                    text-white
                    text-4xl
                    sm:text-5xl
                    lg:text-7xl
                    font-bold
                    ">
                        Minhas Playlists
                    </h1>
                </div>

            </div>
        </div>
       

     </Header>
   
     <LikedContent playlists={playlist}/>
     

   
    

    </div>
    
  );
}

export default Liked;