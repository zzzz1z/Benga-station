import Button from '@/components/Botão';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-neutral-900 text-center p-6 rounded-md w-full max-w-md">
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        <div>{children}</div>
        <Button
          className="mt-4 text-sm text-black hover:text-white"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default Modal;
