"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import useSubscribeModal from '@/hooks/useSubscribeModal.ts';
import { useUser } from '@/hooks/useUser';
import { postData } from '@/libs/helpers';
import { getStripe } from '@/libs/stripeClient';
import { Price, ProductWithPrice } from '@/types';

import Modal from './Modal';
import Button from './Botão';

interface SubscribeModalProps {
  products: ProductWithPrice[];
}

const formatPrice = (price: Price) => {
  const priceString = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency,
    minimumFractionDigits: 0
  }).format((price?.unit_amount || 0) / 100);

  return priceString;
};


const SubscribeModal: React.FC<SubscribeModalProps> = ({
  products
}) => {
  const subscribeModal = useSubscribeModal();
  const { user, isLoading, subscription } = useUser();

  const [priceIdLoading, setPriceIdLoading] = useState<string>();

  const onChange = (open: boolean) => {
    if (!open) {
      subscribeModal.onClose();
    }
  }


  const handleCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return toast.error('Deves ter sessão iniciada');
    }

    if (subscription) {
      setPriceIdLoading(undefined);
      return toast('Já faz parte');
    }

    try {
      const { sessionId } = await postData({
        url: '/api/create-checkout-session',
        data: { price }
      });

      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {


      return toast.error((error as Error)?.message);


    } finally {

      setPriceIdLoading(undefined);
      
    }
  };

  let content = (
    <div className="text-center">
      Sem produtos disponíveis
    </div>
  )

  if (products.length) {
    content = (
      <div>
        {products.map((product) => {
          if (!product.prices?.length) {
            return (
              <div key={product.id}>
                Sem preços aqui
              </div>
            );
          }

          return product.prices.map((price) => (
            <Button 
              key={price.id} 
              onClick={() => handleCheckout(price)}
              disabled={isLoading || price.id === priceIdLoading}
              className="mb-4"
            >
              {`Faça parte da benga station por ${formatPrice(price)} a ${price.interval}`}
            </Button>
          ))
        })}
      </div>
    )
  }

  if (subscription?.status == 'active') {
    content = (
      <div className="text-center">
        Já inscrito
      </div>
    )
  }

  return (
    <Modal
      title="Só disponível para utilizadores premiums"
      description="Ouve as músicas que quiseres aqui na benga station"
      isOpen={subscribeModal.isOpen}
      onChange={onChange}
    >
      {content}
    </Modal>
  );
}

export default SubscribeModal;