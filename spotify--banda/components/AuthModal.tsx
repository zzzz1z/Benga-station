'use client';

import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import useAuthModal from '@/hooks/useAuthModal';
import { useEffect } from 'react';

const AuthModal = () => {


    const supabaseClient = useSupabaseClient();
    const router = useRouter();
    const { session } = useSessionContext();
    const {onClose, isOpen} = useAuthModal();


    useEffect(() => {
        if(session) {
            router.refresh();
            onClose();
        }

    }, [session, router, onClose]);

    const onChange = (open: boolean) => {
        if (!isOpen) {
            onClose();
        }

    }

    

    return (
        <Modal
         title='Bem vindo'
         description='Iniciar sessão'
         isOpen={isOpen}
         onChange={onChange}
        >
            <Auth 
             magicLink
             providers={['apple', 'github', 'google']}
             theme='dark'
             supabaseClient={supabaseClient}
             appearance={{
                theme:ThemeSupa,
                variables: {
                    default: {
                        colors: {
                            brand: '#404040',
                            brandAccent:'#FF0000'
                        }
                    }
                }
             }}/>
             
        </Modal>

    )
}

export default AuthModal;