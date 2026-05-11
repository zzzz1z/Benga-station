// app/account/components/SettingsContent.tsx
'use client'

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

import useAdminModal from '@/hooks/useAdminModal';
import CasaTab from './CasaTab';
import DefinicoesTab from './DefinicoesTab';
import ProfilePic from './ProfilePic';

const SettingsContent = () => {
    const router = useRouter();
    const { isLoading, user, userDetails } = useUser();
    const adminModal = useAdminModal();
    const [activeTab, setActiveTab] = useState<'casa' | 'definicoes'>('casa');

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        }
    }, [isLoading, user, router]);

    return (
        <div className="flex flex-col w-full h-full">
            {/* Profile header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6 gap-y-3">
                <ProfilePic />
                <p className="text-white font-semibold text-lg">
                    {userDetails?.full_name ?? user?.email ?? ''}
                </p>
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