'use client';

import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useAdminModal from '@/hooks/useAdminModal';
import toast from 'react-hot-toast';
import { CiLock } from 'react-icons/ci';
import ButtonUploadOrChange from './ButtonUploadOrChange';

const supabase = createClient();

const DefinicoesTab = () => {
    const { user, userDetails, refreshUserDetails } = useUser();
    const router = useRouter();
    const adminModal = useAdminModal();

    const [firstName, setFirstName] = useState(userDetails?.first_name ?? '');
    const [lastName, setLastName] = useState(userDetails?.last_name ?? '');
    const [newPassword, setNewPassword] = useState('');
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    const updateNames = async () => {
        if (!user) return;
        setLoadingInfo(true);
        const { error } = await supabase
            .from('users')
            .update({ first_name: firstName, last_name: lastName })
            .eq('id', user.id);

        if (error) {
            toast.error('Erro ao atualizar informações.');
        } else {
            toast.success('Informações atualizadas!');
            await refreshUserDetails();
        }
        setLoadingInfo(false);
    };

    const updatePassword = async () => {
        if (!newPassword) return;
        setLoadingPassword(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            toast.error('Erro ao atualizar password.');
        } else {
            toast.success('Password atualizada!');
            setNewPassword('');
        }
        setLoadingPassword(false);
    };

    const handleAdminClick = () => {
        if (userDetails?.role === 'admin') {
            router.push('/account/adminControls');
        } else {
            adminModal.onOpen();
        }
    };

    return (
        <div className="flex flex-col gap-y-6 px-6 py-6">

            {/* Account info */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col gap-y-4">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                    Informações da conta
                </h2>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-neutral-400">Email</label>
                    <p className="text-white text-sm">{user?.email}</p>
                </div>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-neutral-400">Primeiro nome</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none border border-neutral-700 focus:border-neutral-500"
                    />
                </div>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-neutral-400">Último nome</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none border border-neutral-700 focus:border-neutral-500"
                    />
                </div>
                <button
                    onClick={updateNames}
                    disabled={loadingInfo}
                    className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                    {loadingInfo ? 'A guardar...' : 'Guardar alterações'}
                </button>
            </div>

            {/* Password */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                    <CiLock size={16} className="text-neutral-400" />
                    <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                        Segurança
                    </h2>
                </div>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-neutral-400">Nova password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none border border-neutral-700 focus:border-neutral-500"
                    />
                </div>
                <button
                    onClick={updatePassword}
                    disabled={loadingPassword || !newPassword}
                    className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                    {loadingPassword ? 'A atualizar...' : 'Atualizar password'}
                </button>
            </div>

            {/* Avatar */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col gap-y-4">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                    Foto de perfil
                </h2>
                <ButtonUploadOrChange
                    hasAvatar={true}
                    onImageUpdate={() => refreshUserDetails()}
                />
            </div>

            {/* Admin */}
            <div
                onClick={handleAdminClick}
                className="rounded-xl bg-white/5 border border-white/10 p-5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition"
            >
                <div className="flex flex-col">
                    <p className="text-white text-sm font-medium">
                        {userDetails?.role === 'admin' ? 'Painel Admin' : 'Tornar-me Admin'}
                    </p>
                    <p className="text-neutral-500 text-xs mt-0.5">
                        {userDetails?.role === 'admin' ? 'Aceder ao painel de administração' : 'Enviar candidatura'}
                    </p>
                </div>
                <img
                    width={48}
                    height={48}
                    src={userDetails?.role === 'admin'
                        ? 'https://i.pinimg.com/originals/df/39/ca/df39cac523d792140df3a8439d0b4d72.gif'
                        : 'https://64.media.tumblr.com/c4d31ea77976ff167da6f8b4d7297351/677c0c06eab1c56c-ae/s540x810/f99e18ed9cdd3a1dba1c1347e942b9f462e4950e.gifv'
                    }
                    alt="admin"
                    className="rounded-lg"
                />
            </div>

        </div>
    );
};

export default DefinicoesTab;