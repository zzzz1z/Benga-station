import { useRouter } from 'next/navigation';
import React from 'react'
import { CiLock, CiUser } from "react-icons/ci";
import { AiOutlineProfile } from "react-icons/ai";
import { useUser } from '@/hooks/useUser';



const AccountButtons = () => {



 


    const router = useRouter()
    const user = useUser()

   const onClick = () =>{


        if(user.user?.role === 'admin'){

            router.push('/account/adminControls')

        } else {

            return // modal to send an application to change the current user role from authenticated to admin but only after i confirm it in supabase 
        }

    }
    
  return (
    <div className='h-full flex flex-col items-center justify-start mr-auto p-8 gap-10'>


        <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=> router.push('/account')}>

            <CiUser
            size={30}
            />

            <p className='text-center'> Casa </p>
        </div>
        
        
        
        
        
        
        
        
        <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=> router.push('/account/accountSettings')}>

            <AiOutlineProfile
                size={30}
            />

            <p className='text-center'> Conta </p>
        </div>
        
        
        <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=> router.push('/account/accountPrivacy')}>

            <CiLock
                size={30}
            />

            <p className='text-center'> Segurança </p>
        </div>

        {user.user?.role === 'admin' ? (
            <div className='flex justify-start gap-4 w-full cursor-pointer' onClick={()=>router.push('/account/adminControls')}>

                <img width={100} height={100} src="/images/ninjadois.png" alt="Ninja" />
            
            </div>
            )
            :
            (

                <div className='flex justify-center items-center gap-4 w-full cursor-pointer' onClick={onClick}>

                <img width={100} height={100} src="/images/ninja.png" alt="Ninja" />
            
            </div>
        ) }
        



        
    </div>
  )
}

export default AccountButtons
