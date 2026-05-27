'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const WelcomePage = () => {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
    });
    const json = await res.json();

    if (json.valid) {
        localStorage.setItem('access_granted', '1');
        router.replace('/');
    } else {
        setError('Código inválido. Tenta novamente.');
    }

    setLoading(false);
};

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 px-6 text-center">
            <div className="mb-8">
                <Image
                    src="/images/likedit.png"
                    alt="Benga Station"
                    width={120}
                    height={120}
                    className="rounded-2xl mx-auto mb-6"
                    priority
                />
                <h1 className="text-white text-4xl font-bold mb-2">Benga Station</h1>
                <p className="text-neutral-400 text-sm max-w-xs mx-auto">
                    A tua música favorita, grátis e sem limites.
                </p>
            </div>

            <div className="bg-neutral-800 rounded-2xl p-6 w-full max-w-sm mb-6">
                <p className="text-white text-sm font-medium mb-1">🔒 Acesso restrito</p>
                <p className="text-neutral-400 text-xs mb-4">
                    Esta app está em fase de testes. Introduz o código de acesso para continuar.
                </p>

                <input
                    type="password"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Código de acesso"
                    className="w-full bg-neutral-700 text-white text-sm rounded-full px-4 py-3 outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-500 mb-3"
                />

                {error && (
                    <p className="text-red-400 text-xs mb-3">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || !code.trim()}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 transition text-white text-sm font-semibold py-3 rounded-full"
                >
                    {loading ? 'A verificar...' : 'Entrar'}
                </button>
            </div>

            <div className="bg-neutral-800 rounded-2xl p-5 w-full max-w-sm">
                <p className="text-white text-sm font-medium mb-2">❤️ Ajuda a manter a app</p>
                <p className="text-neutral-400 text-xs leading-relaxed">
                    A Benga Station é completamente gratuita. Se gostas do projeto e queres ajudar a cobrir os custos do servidor, considera fazer uma pequena doação. Muito obrigado pelo apoio!
                </p>
            </div>
        </div>
    );
};

export default WelcomePage;