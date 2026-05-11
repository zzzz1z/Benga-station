'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import useAdminModal from '@/hooks/useAdminModal';
import CasaTab from './CasaTab';
import DefinicoesTab from './DefinicoesTab';
import ProfilePic from './ProfilePic';
import { Song, Playlist } from '@/types';

interface SettingsContentProps {
    likedSongs: Song[];
    playlists: Playlist[];
}

const SettingsContent = ({ likedSongs, playlists }: SettingsContentProps) => {
    const router = useRouter();
    const { isLoading, user, userDetails } = useUser();
    const [activeTab, setActiveTab] = useState<'casa' | 'definicoes'>('casa');

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        }
    }, [isLoading, user, router]);

    const displayName = userDetails?.full_name
        ?? (userDetails?.first_name
            ? `${userDetails.first_name} ${userDetails.last_name ?? ''}`.trim()
            : null)
        ?? user?.email?.split('@')[0]
        ?? '';

    return (
        <div className="flex flex-col w-full h-full">

            {/* Instagram-style profile header */}
            <div className="flex flex-col px-6 pt-3 pb-4 gap-y-4">
                <div className="flex items-center gap-x-6">
                    <ProfilePic />
                    <div className="flex flex-1 justify-around">
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-lg leading-tight">{likedSongs.length}</span>
                            <span className="text-neutral-400 text-xs mt-0.5">Favoritas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-lg leading-tight">{playlists.length}</span>
                            <span className="text-neutral-400 text-xs mt-0.5">Playlists</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-0.5">
                    <p className="text-white font-semibold text-sm">{displayName}</p>
                    <p className="text-neutral-500 text-xs">{user?.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-700 px-6">
                <button
                    onClick={() => setActiveTab('casa')}
                    className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px
                        ${activeTab === 'casa'
                            ? 'border-red-500 text-white'
                            : 'border-transparent text-neutral-400 hover:text-white'}`}
                >
                    Casa
                </button>
                <button
                    onClick={() => setActiveTab('definicoes')}
                    className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px
                        ${activeTab === 'definicoes'
                            ? 'border-red-500 text-white'
                            : 'border-transparent text-neutral-400 hover:text-white'}`}
                >
                    Definições
                </button>
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
}

export default SettingsContent;