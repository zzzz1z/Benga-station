'use client';

import { useState } from 'react';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { Playlist } from '@/types';
import { MdEdit } from 'react-icons/md';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import toast from 'react-hot-toast';
import { usePlaylists } from '@/hooks/usePlaylists';

interface EditPlaylistProps {
    data: Playlist;
    onUpdate: () => void;
}

const EditPlaylist: React.FC<EditPlaylistProps> = ({ data, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const { refreshPlaylists } = usePlaylists();

    const { register, handleSubmit } = useForm<FieldValues>({
        defaultValues: {
            title: data.title,
            description: data.description || '',
        }
    });

    const onChange = (open: boolean) => {
        if (!open) setIsOpen(false);
    };

    const onSubmit: SubmitHandler<FieldValues> = async (values) => {
        try {
            setIsLoading(true);
            const { error } = await supabase
                .from('Playlists')
                .update({ title: values.title, description: values.description })
                .eq('id', data.id);

            if (error) throw error;

            toast.success('Playlist atualizada!');
            await refreshPlaylists();
            onUpdate();
            setIsOpen(false);
        } catch {
            toast.error('Erro ao atualizar playlist.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="hover:text-white transition text-neutral-400"
            >
                <MdEdit size={28} />
            </button>

            <Modal
                title="Editar Detalhes"
                description="Altere as informações da sua playlist"
                isOpen={isOpen}
                onChange={onChange}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                    <Input
                        id="title"
                        disabled={isLoading}
                        {...register('title', { required: true })}
                        placeholder="Título da playlist"
                    />
                    <textarea
                        id="description"
                        disabled={isLoading}
                        {...register('description')}
                        placeholder="Descrição (opcional)"
                        className="flex w-full rounded-md bg-neutral-700 border border-transparent px-3 py-3 text-sm placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none min-h-[100px]"
                    />
                    <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full rounded-full bg-green-500 border border-transparent px-3 py-3 disabled:cursor-not-allowed disabled:opacity-50 text-black font-bold hover:opacity-75 transition"
                    >
                        Salvar Alterações
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default EditPlaylist;