'use client'

import Button from '@/components/Botão';
import useSubscribeModal from '@/hooks/useSubscribeModal.ts';
import { useUser } from '@/hooks/useUser';
import { postData } from '@/libs/helpers';
import { useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';



const AccountContent =  () => {

    const router = useRouter();
    const subscribeModal = useSubscribeModal();
    const { isLoading, subscription, user} = useUser();

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
    <div className='mb-7 px-6'>
       
        {!subscription && (
            <div className='flex flex-col gap-y-4'>
                <p>Sem planos activos</p>
                <Button
                 onClick={subscribeModal.onOpen}
                 className='w-[300px]'
                 >
                    Te inscreve ya? 😉

                 </Button>
            </div>

        )}
        {subscription && (
            <div className='flex flex-col gap-y-4'>
                <p>
                    Plano Atual: <b>{subscription?.prices?.products?.name}</b> 🥸
                </p>
                <Button
                disabled={loading ?? isLoading}
                onClick={redirectToCustomerPortal}
                className='w-[300px]'
                >
                    Abrir o portal do cliente 

                </Button>
            </div>
        )}
    </div>
  )
}


export default AccountContent
