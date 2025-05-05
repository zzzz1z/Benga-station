'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
import ProfilePic from './ProfilePic';
import AccountView from './AccountView';
import AccountButtons from './AccountButtons';



const AccountContent =  () => {

    const router = useRouter();
    const { isLoading, user} = useUser();


    useEffect(()=>{

        if(!isLoading && !user){
            router.replace('/');
        }
    }, [isLoading, user, router]);



    return (
        <div className=' flex justify-between w-full p-1 h-full'>

            <div className='flex flex-col w-96 m-0'>

                <div className=''>
                <ProfilePic/>
                
                </div>
                <div className=''>
                
                <AccountButtons/>
                </div>


            </div>
        
            


            <div className='flex w-full'>
                <AccountView/>

            </div>

        
    
        </div>
    )
}


export default AccountContent
