'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

import React, { useEffect } from 'react'
import ProfilePic from '../../components/ProfilePic';
import AccountButtons from '../../components/AccountButtons';
import PrivacyContent from './privacyContent';



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
                <PrivacyContent />
            </div>
        </div>

    </div>
    )
}


export default PrivacyView;
