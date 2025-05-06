'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
import AccountView from './AccountView';
import AccountButtons from './AccountButtons';
import ProfilePic from './ProfilePic';



const PrivacyView =  () => {

    const router = useRouter();
    const { isLoading, user} = useUser();


    useEffect(()=>{

        if(!isLoading && !user){
            router.replace('/');
        }
    }, [isLoading, user, router]);



    return (
        <div className='flex justify-center w-full p-1 h-full'>

        <div className='flex flex-col w-56 ml-1'>
            <div className=''>
                <ProfilePic />
            </div>
            <div className=''>
                <AccountButtons />
            </div>
        </div>

        {/* Account View Section */}
        <div className='flex w-full'>
            <div className="flex-1">
                <AccountView />
            </div>
        </div>

    </div>
    )
}


export default PrivacyView;
