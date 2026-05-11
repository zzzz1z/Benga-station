import { useRouter } from 'next/navigation';
import React from 'react'
import { CiLock, CiUser } from "react-icons/ci";
import { AiOutlineProfile } from "react-icons/ai";
import { useUser } from '@/hooks/useUser';
import useAdminModal from '@/hooks/useAdminModal';



const AccountButtons = () => {



 

    const adminModal = useAdminModal()
    const router = useRouter()
    const user = useUser()

   const onClick = async () =>{
    


        if(user.user?.role === 'admin'){

            router.push('/account/adminControls')

        } else {

            return adminModal.onOpen() // modal to send an application to change the current user role from authenticated to admin but only after i confirm it in supabase 
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

        {user.userDetails?.role === 'admin' ? (
            <div className='flex h-full justify-center gap-4 w-full cursor-pointer' onClick={()=>router.push('/account/adminControls')}>

                <img width={400} height={300} src="https://i.pinimg.com/originals/df/39/ca/df39cac523d792140df3a8439d0b4d72.gif" alt="https://www.slashfilm.com/img/gallery/how-to-watch-the-naruto-franchise-in-order/l-intro-1702004665.jpg" />
            
            </div>
            )
            :
            (

                <div className='flex justify-center items-center gap-4 w-full cursor-pointer' onClick={onClick}>

                <img width={400} height={300} src="https://64.media.tumblr.com/c4d31ea77976ff167da6f8b4d7297351/677c0c06eab1c56c-ae/s540x810/f99e18ed9cdd3a1dba1c1347e942b9f462e4950e.gifv" alt="https://i.pinimg.com/originals/81/e6/cc/81e6ccbea719f13a2b84ef269e2ee423.gif" />
            
            </div>
        ) }
        



        
    </div>
  )
}

export default AccountButtons
