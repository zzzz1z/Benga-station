import { useRouter } from 'next/navigation';
import React from 'react'
import { CiLock } from "react-icons/ci";
import { AiOutlineProfile } from "react-icons/ai";


const AccountButtons = () => {




    const router = useRouter()


    
  return (
    <div className='h-full flex flex-col items-center justify-start mr-auto p-8 gap-10'>


        <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=> router.push('account/accountSettings')}>

            <AiOutlineProfile
                size={30}
            />

            <p className='text-center'> Conta </p>
        </div>
        
        
        <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=> router.push('account/settings')}>

            <CiLock
                size={30}
            />

            <p className='text-center'> Segurança </p>
        </div>

        



        
    </div>
  )
}

export default AccountButtons
