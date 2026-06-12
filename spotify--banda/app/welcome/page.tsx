'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const WelcomePage = () => {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fading, setFading] = useState(false);


const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
    });
    const json = await res.json();

    if (json.valid) {
        setFading(true);
        setTimeout(() => router.replace('/'), 600);
    } else {
        setError('Código inválido. Tenta novamente.');
        setLoading(false);
    }
};

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const BADGE_CUT = "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)";
    const GAMER_CUT = "polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)";


    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 px-6"
            style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.6s ease',
                background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.012) 3px, rgba(239,68,68,0.012) 4px)',
            }}
        >
            {/* top accent line */}
            <div className="fixed top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }} />

            <div className="flex flex-col items-center w-full max-w-sm gap-y-10">

                {/* logo + title */}
                <div className="flex flex-col items-center gap-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 blur-2xl opacity-30 rounded-lg"
                            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.8), transparent 70%)' }} />
                        <div className="relative w-20 h-20 bg-red-500 p-[2px]"
                            style={{ clipPath: GAMER_CUT }}>
                            <div className="w-full h-full bg-neutral-950 overflow-hidden"
                                style={{ clipPath: GAMER_CUT }}>
                                <Image
                                    src="/images/likedit.png"
                                    alt="Benga Station"
                                    width={80}
                                    height={80}
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', clipPath: BADGE_CUT }}>
                            Beta
                        </span>
                        <h1 className="text-white text-5xl font-black tracking-tighter uppercase"
                            style={{ textShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
                            Benga Station
                        </h1>
                        <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">
                            Música sem limites
                        </p>
                    </div>
                </div>

                {/* access form */}
                <div className="w-full flex flex-col gap-y-4">
                    <div className="flex flex-col gap-y-1">
                        <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">
                            Código de acesso
                        </p>
                        <div className="relative">
                            <input
                                type="password"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="••••••••"
                                className="w-full bg-neutral-900 text-white text-sm px-4 py-3 outline-none border border-white/10 focus:border-red-500/50 transition placeholder:text-neutral-700"
                                style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                            />
                        </div>
                        {error && (
                            <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest mt-1">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !code.trim()}
                        className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
                    >
                        {loading ? 'A verificar...' : 'Entrar'}
                    </button>
                </div>

                {/* support note */}
                <div className="w-full border-t border-white/5 pt-6">
                    <p className="text-neutral-600 text-[10px] font-mono uppercase tracking-widest text-center leading-relaxed">
                        App gratuita — considera apoiar o projeto<br />
                        para ajudar a cobrir os custos do servidor
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;