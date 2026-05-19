'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import CasaTab from './CasaTab';
import DefinicoesTab from './DefinicoesTab';
import ProfilePic from './ProfilePic';
import ImportPlaylistButton from '@/components/ImportPlaylistButton';
import { Song, Playlist } from '@/types';
import { HiLightningBolt } from 'react-icons/hi';
import { TbPlaylist } from 'react-icons/tb';
import { AiFillHeart } from 'react-icons/ai';

const SLASH = 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)';

interface SettingsContentProps {
    likedSongs: Song[];
    playlists: Playlist[];
}

const SettingsContent = ({ likedSongs, playlists }: SettingsContentProps) => {
    const router = useRouter();
    const { isLoading, user, userDetails } = useUser();
    const [activeTab, setActiveTab] = useState<'casa' | 'definicoes'>('casa');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/');
    }, [isLoading, user, router]);

    if (!mounted || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-40 gap-y-3">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent animate-spin" />
                <p className="text-red-600/40 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                    A_CARREGAR...
                </p>
            </div>
        );
    }

    const displayName = userDetails?.full_name
        ?? (userDetails?.first_name
            ? `${userDetails.first_name} ${userDetails.last_name ?? ''}`.trim()
            : null)
        ?? user?.email?.split('@')[0]
        ?? '';

    return (
        <div className="flex flex-col w-full h-full">

            {/* Profile header */}
            <div className="relative flex flex-col items-center px-6 pt-6 pb-5 gap-y-5 overflow-hidden">

                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.015) 3px, rgba(239,68,68,0.015) 4px)' }} />
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)', boxShadow: '0 0 8px rgba(239,68,68,0.3)' }} />

                {/* Avatar + stats */}
                <div className="relative z-10 flex items-center gap-x-8 w-full max-w-sm">
                    <ProfilePic />

                    <div className="flex gap-x-5">
                        <div className="flex flex-col items-center gap-y-1">
                            <div className="flex items-center gap-x-1.5">
                                <AiFillHeart size={10} className="text-red-500/60" />
                                <span className="text-white font-black text-2xl leading-none tabular-nums"
                                    style={{ textShadow: '0 0 12px rgba(239,68,68,0.6)' }}>
                                    {likedSongs.length}
                                </span>
                            </div>
                            <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-[0.2em]">Favoritas</span>
                        </div>

                        <div className="w-px self-stretch"
                            style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.4), transparent)' }} />

                        <div className="flex flex-col items-center gap-y-1">
                            <div className="flex items-center gap-x-1.5">
                                <TbPlaylist size={10} className="text-red-500/60" />
                                <span className="text-white font-black text-2xl leading-none tabular-nums"
                                    style={{ textShadow: '0 0 12px rgba(239,68,68,0.6)' }}>
                                    {playlists.length}
                                </span>
                            </div>
                            <span className="text-neutral-600 text-[9px] font-mono uppercase tracking-[0.2em]">Playlists</span>
                        </div>
                    </div>
                </div>

                {/* Name + badge */}
                <div className="relative z-10 flex flex-col items-center gap-y-1.5 w-full">
                    <div className="flex items-center gap-x-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', clipPath: SLASH }}>
                            PLAYER
                        </span>
                        <p className="text-white font-black uppercase tracking-tight text-base">{displayName}</p>
                    </div>
                    <p className="text-neutral-700 font-mono text-[9px] tracking-widest">{user?.email ?? ''}</p>
                </div>

                {/* Import button */}
                <div className="relative z-10 w-full flex justify-center">
                    <ImportPlaylistButton />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-red-900/20 px-4">
                {(['casa', 'definicoes'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="relative flex-1 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors"
                        style={{ color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.25)' }}
                    >
                        {tab === 'casa' ? 'Casa' : 'Definições'}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px]"
                                style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'casa'
                    ? <CasaTab likedSongs={likedSongs} playlists={playlists} />
                    : <DefinicoesTab />
                }
            </div>
        </div>
    );
};

export default SettingsContent;