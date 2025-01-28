import React from 'react'
import { CiPlay1 } from "react-icons/ci";


const PlaySongsFromPlaylist = () => {
  return (
    <button
    className='
    rounded-full
    p-2
    flex
    items-center
    justify-center
    hover:opacity-75transition'>
     <CiPlay1 size={40} 
     />
    </button>
  )
}

export default PlaySongsFromPlaylist
