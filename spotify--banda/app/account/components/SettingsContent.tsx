'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import CasaTab from './CasaTab';
import DefinicoesTab from './DefinicoesTab';
import ProfilePic from './ProfilePic';
import ImportPlaylistButton from '@/components/ImportPlaylistButton';
import { Song, Playlist } from '@/types';
import { BounceLoader } from 'react-spinners';

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
            <div className="flex justify-center items-center h-40">
                <BounceLoader color="#A52A2A" size={40} />
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

            {/* ── Gamer profile header ── */}
            <div className="relative flex flex-col items-center px-6 pt-6 pb-5 gap-y-5 overflow-hidden">

                {/* Red scanline background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.015) 3px, rgba(239,68,68,0.015) 4px)',
                    }}
                />

                {/* Top accent line */}
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }}
                />

                {/* Avatar + stats row */}
                <div className="relative z-10 flex items-center gap-x-8 w-full max-w-sm">
                    <div className="relative flex-shrink-0">
                        <div
                            className="absolute inset-0 rounded-full blur-md opacity-60"
                            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }}
                        />
                        <div
                            className="relative"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
                        >
                            <ProfilePic />
                        </div>
                     
                    </div>

                    {/* Stats */}
                    <div className="flex gap-x-6">
                        <div className="flex flex-col items-center gap-y-0.5">
                            <span
                                className="text-white font-black text-2xl leading-none tabular-nums"
                                style={{ textShadow: '0 0 12px rgba(239,68,68,0.6)' }}
                            >
                                {likedSongs.length}
                            </span>
                            <span className="text-neutral-500 text-[10px] uppercase tracking-widest font-medium">
                                Favoritas
                            </span>
                        </div>

                        <div className="w-px self-stretch" style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.4), transparent)' }} />

                        <div className="flex flex-col items-center gap-y-0.5">
                            <span
                                className="text-white font-black text-2xl leading-none tabular-nums"
                                style={{ textShadow: '0 0 12px rgba(239,68,68,0.6)' }}
                            >
                                {playlists.length}
                            </span>
                            <span className="text-neutral-500 text-[10px] uppercase tracking-widest font-medium">
                                Playlists
                            </span>
                        </div>
                    </div>
                </div>

                {/* Name + email */}
                <div className="relative z-10 flex flex-col items-center gap-y-1 w-full">
                    <div className="flex items-center gap-x-2">
                        <span
                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                            style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.4)',
                                color: '#f87171',
                                clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                            }}
                        >
                            Player
                        </span>
                        <p className="text-white font-bold text-base tracking-wide">
                            {displayName}
                        </p>
                    </div>
                    <p className="text-neutral-600 text-xs tracking-wide">
                        {user?.email ?? ''}
                    </p>
                </div>

                {/* Centered import button */}
                <div className="relative z-10 flex justify-center w-full">
                    <ImportPlaylistButton />
                </div>

                {/* Bottom accent line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }}
                />
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-neutral-800 px-6">
                {(['casa', 'definicoes'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="relative px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
                        style={{ color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.3)' }}
                    >
                        {tab === 'casa' ? 'Casa' : 'Definições'}
                        {activeTab === tab && (
                            <span
                                className="absolute bottom-0 left-0 right-0 h-0.5"
                                style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'casa'
                    ? <CasaTab likedSongs={likedSongs} playlists={playlists} />
                    : <DefinicoesTab />
                }
            </div>
        </div>
    );
}

export default SettingsContent;