'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import useAdminModal from '@/hooks/useAdminModal';
import CasaTab from './CasaTab';
import DefinicoesTab from './DefinicoesTab';
import ProfilePic from './ProfilePic';
import { createClient } from '@/utils/supabase/client';

const SettingsContent = () => {
    const router = useRouter();
    const { isLoading, user, userDetails } = useUser();
    const adminModal = useAdminModal();
    const [activeTab, setActiveTab] = useState<'casa' | 'definicoes'>('casa');
    const [stats, setStats] = useState({ liked: 0, playlists: 0, songs: 0 });

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        if (!user?.id) return;
        const supabase = createClient();

        const fetchStats = async () => {
            const [likedRes, playlistRes, songsRes] = await Promise.all([
                supabase
                    .from('liked_songs')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),
                supabase
                    .from('playlists')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),
                supabase
                    .from('Songs')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id),
            ]);

            setStats({
                liked: likedRes.count ?? 0,
                playlists: playlistRes.count ?? 0,
                songs: songsRes.count ?? 0,
            });
        };

        fetchStats();
    }, [user?.id]);

    const displayName = userDetails?.full_name
        ?? (userDetails?.first_name
            ? `${userDetails.first_name} ${userDetails.last_name ?? ''}`.trim()
            : null)
        ?? user?.email?.split('@')[0]
        ?? '';

    return (
        <div className="flex flex-col w-full h-full">

            {/* Instagram-style profile header */}
            <div className="flex flex-col px-6 pt-8 pb-4 gap-y-4">

                {/* Top row: avatar + stats */}
                <div className="flex items-center gap-x-6">
                    <ProfilePic />

                    {/* Stats */}
                    <div className="flex flex-1 justify-around">
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-lg leading-tight">{stats.songs}</span>
                            <span className="text-neutral-400 text-xs mt-0.5">Músicas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-lg leading-tight">{stats.liked}</span>
                            <span className="text-neutral-400 text-xs mt-0.5">Favoritas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-lg leading-tight">{stats.playlists}</span>
                            <span className="text-neutral-400 text-xs mt-0.5">Playlists</span>
                        </div>
                    </div>
                </div>

                {/* Name + email below */}
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
                    ? <CasaTab />
                    : <DefinicoesTab />
                }
            </div>
        </div>
    );
}

export default SettingsContent;