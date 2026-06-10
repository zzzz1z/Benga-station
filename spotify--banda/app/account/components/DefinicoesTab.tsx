'use client';

import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useAdminModal from '@/hooks/useAdminModal';
import toast from 'react-hot-toast';
import { CiLock } from 'react-icons/ci';
import { FaUserAlt } from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import ButtonUploadOrChange from './ButtonUploadOrChange';

const supabase = createClient();
const SLASH = 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';
const SLASH_SM = 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)';

const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`border border-red-900/20 bg-white/[0.02] flex flex-col gap-y-4 p-5 relative overflow-hidden ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
        {children}
    </div>
);

const FieldInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600">{label}</label>
        <input
            {...props}
            className="w-full bg-neutral-900 border border-red-900/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-red-500/50 font-mono placeholder:text-neutral-700 transition"
            style={{ clipPath: SLASH_SM }}
        />
    </div>
);

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
        if (error) toast.error('Erro ao atualizar.');
        else { toast.success('Guardado!'); await refreshUserDetails(); }
        setLoadingInfo(false);
    };

    const updatePassword = async () => {
        if (!newPassword) return;
        setLoadingPassword(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) toast.error('Erro ao atualizar password.');
        else { toast.success('Password atualizada!'); setNewPassword(''); }
        setLoadingPassword(false);
    };

    const handleAdminClick = () => {
        if (userDetails?.role === 'admin') router.push('/account/adminControls');
        else adminModal.onOpen();
    };

    const SaveButton = ({ onClick, loading, disabled, label, loadingLabel }: any) => (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="w-full py-2.5 text-[10px] font-mono uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
                background: (!disabled && !loading) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${(!disabled && !loading) ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)'}`,
                color: (!disabled && !loading) ? '#f87171' : '#4b4b4b',
                clipPath: SLASH,
            }}
        >
            {loading
                ? <span className="flex items-center justify-center gap-x-2">
                    <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
                    {loadingLabel}
                  </span>
                : label
            }
        </button>
    );

    return (
        <div className="flex flex-col gap-y-3 px-4 py-4">

            {/* Account info */}
            <Section>
                <div className="flex items-center gap-x-2">
                    <FaUserAlt size={10} className="text-red-500/50" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-red-500/50">CONTA</span>
                </div>
                <div className="flex flex-col gap-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600">Email</label>
                    <p className="text-neutral-400 font-mono text-xs px-3 py-2.5 border border-red-900/10 bg-neutral-900/50"
                        style={{ clipPath: SLASH_SM }}>
                        {user?.email}
                    </p>
                </div>
                <FieldInput label="Primeiro nome" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <FieldInput label="Último nome" value={lastName} onChange={e => setLastName(e.target.value)} />
                <SaveButton onClick={updateNames} loading={loadingInfo} disabled={false} label="GUARDAR_ALTERAÇÕES" loadingLabel="A GUARDAR..." />
            </Section>

            {/* Password */}
            <Section>
                <div className="flex items-center gap-x-2">
                    <CiLock size={12} className="text-red-500/50" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-red-500/50">SEGURANÇA</span>
                </div>
                <FieldInput label="Nova password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                <SaveButton onClick={updatePassword} loading={loadingPassword} disabled={!newPassword} label="ATUALIZAR_PASSWORD" loadingLabel="A ATUALIZAR..." />
            </Section>

            {/* Avatar */}
            <Section>
                <div className="flex items-center gap-x-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-red-500/50">AVATAR</span>
                </div>
                <ButtonUploadOrChange hasAvatar={true} onImageUpdate={() => refreshUserDetails()} />
            </Section>

            {/* Admin */}
            <div
                onClick={handleAdminClick}
                className="border border-red-900/20 flex items-center justify-between p-4 cursor-pointer bg-red-500/5 transition relative overflow-hidden"
                style={{ clipPath: SLASH }}
            >
                <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
                <div className="flex flex-col gap-y-0.5">
                    <div className="flex items-center gap-x-2">
                        <HiLightningBolt size={10} className="text-red-500 animate-pulse" />
                        <p className="text-white text-xs font-black uppercase tracking-tight">
                            {userDetails?.role === 'admin' ? 'PAINEL_ADMIN' : 'TORNAR_ADMIN'}
                        </p>
                    </div>
                    <p className="text-neutral-600 font-mono text-[9px] uppercase tracking-widest">
                        {userDetails?.role === 'admin' ? 'Aceder ao painel' : 'Enviar candidatura'}
                    </p>
                </div>
                <img
                    width={44} height={44}
                    src={userDetails?.role === 'admin'
                        ? 'https://i.pinimg.com/originals/df/39/ca/df39cac523d792140df3a8439d0b4d72.gif'
                        : 'https://64.media.tumblr.com/c4d31ea77976ff167da6f8b4d7297351/677c0c06eab1c56c-ae/s540x810/f99e18ed9cdd3a1dba1c1347e942b9f462e4950e.gifv'
                    }
                    alt="admin"
                    className="flex-shrink-0"
                    style={{ clipPath: SLASH }}
                />
            </div>
        </div>
    );
};

export default DefinicoesTab;