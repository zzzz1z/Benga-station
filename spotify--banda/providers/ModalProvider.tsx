'use client';

import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import UploadModal from '@/components/UploadModal';
import SubscribeModal from '@/components/SubscribeModal';
import { ProductWithPrice } from '@/types';
import PlaylistModal from '@/components/PlaylistModal';

interface ModalProviderProps {
    products: ProductWithPrice[];
};


const ModalProvider: React.FC<ModalProviderProps> = ({
    products
}
) => {
    
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (

    <>

      <AuthModal/>
      <UploadModal/>
    
      <PlaylistModal/> 
         
    </>
      
    )
}

export default ModalProvider;