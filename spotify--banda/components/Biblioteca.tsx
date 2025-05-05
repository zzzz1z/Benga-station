"use client"

import useAuthModal from "@/hooks/useAuthModal"
import useUploadModal from "@/hooks/useUploadModal"
import { useUser } from "@/hooks/useUser"
import { Playlist } from "@/types"
import { AiOutlinePlus } from "react-icons/ai"
import { TbPlaylist } from "react-icons/tb"
import PlaylistItem from "@/app/playlists/components/PlaylistsItem"

interface BibliotecaProps {
  songs: any;
  playlists: any;
}

const Biblioteca: React.FC<BibliotecaProps> = ({
  songs,
  playlists
}) => {
  const authModal = useAuthModal();
  const uploadModal = useUploadModal();
  const user  = useUser();

  const onClick = () => {
    if (!user) {
      return authModal.onOpen('sign_up');
    }
    return uploadModal.onOpen();
  }

  return (
    <div className="flex flex-col">
      {/* Only show this section to admins */}
      {user.userDetails?.role === 'admin' && (
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="inline-flex items-center gap-x-2">
            <TbPlaylist className="text-neutral-400" size={26} />
            <p className="text-neutral-400 font-medium text-md flex-wrap">
              Adicionar música
            </p>
          </div>
          <AiOutlinePlus
            onClick={onClick}
            size={20}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
        </div>
      )}

      <div className="flex flex-col gap-y-2 mt-4 px-3">
        <div>
          {songs.map((item: Playlist) => (
            <PlaylistItem key={item.id} data={item} />
          ))}
          {playlists.map((item: Playlist) => (
            <PlaylistItem key={item.id} data={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Biblioteca;
