'use client'

import Button from '@/components/Botão';
import useSubscribeModal from '@/hooks/useSubscribeModal.ts';
import { useUser } from '@/hooks/useUser';
import { postData } from '@/libs/helpers';
import { useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import ProfilePic from '../../components/ProfilePic';
import AccountButtons from '../../components/AccountButtons';
import SettingsView from './Settingsview';


const SettingsContent =  () => {

    const router = useRouter();
    const subscribeModal = useSubscribeModal();
    const { isLoading, user} = useUser();

    const [loading, setLoading] = useState(false);

    useEffect(()=>{

        if(!isLoading && !user){
            router.replace('/');
        }
    }, [isLoading, user, router]);

    const redirectToCustomerPortal = async () => {
        setLoading(true);

        try {
            const {url} = await postData({
                url: ' /api/create-portal-link'
            });


            if(url){
                
                window.location.assign(url)

            }

            

        } catch (error){
            if(error){
                toast.error( (error as Error).message);

            }

            setLoading(false)

        }
    }

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
                <SettingsView/>

            </div>

        
    
        </div>
    )
}


export default SettingsContent
