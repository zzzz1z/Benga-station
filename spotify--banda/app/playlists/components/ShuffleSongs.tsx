import React from 'react'
import { PiShuffleAngularThin } from "react-icons/pi";


const ShuffleSongs = () => {
  return (
    <button
    className='
    rounded-full
    p-2
    flex
    items-center
    justify-center
    hover:opacity-75transition'>
     <PiShuffleAngularThin size={40} 
     />
    </button>
  )
}

export default ShuffleSongs
