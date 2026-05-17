'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { HiSignal } from 'react-icons/hi2';
import { useSessionContext } from '@/providers/SessionContext';

const GAMER_CUT = "polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)";

export default function SessionJoinPage() {
  const { code } = useParams<{ code: string }>();
  const { user, isLoading: userLoading } = useUser();
  const { joinSession, session, isConnecting, error } = useSessionContext();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);

  // Auto-join once user is loaded
  useEffect(() => {
    if (userLoading || !user || !code || autoJoining || session) return;
    setAutoJoining(true);
    joinSession(code.toUpperCase()).then(ok => {
      if (ok) {
        setJoined(true);
        // Redirect to home after a short delay
        setTimeout(() => router.push('/'), 1500);
      }
    });
  }, [user, userLoading, code, autoJoining, session]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-y-6 text-center max-w-sm">
          <div style={{ clipPath: GAMER_CUT }} className="w-20 h-20 bg-red-900/30 flex items-center justify-center border border-red-900/50">
            <HiSignal size={32} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl uppercase tracking-tight">Sessão Conjunta</h1>
            <p className="text-neutral-400 text-sm mt-2">Tens de iniciar sessão para entrar.</p>
            <p className="text-red-400 font-mono text-lg tracking-widest mt-3">{code}</p>
          </div>
          <button
            onClick={() => router.push(`/login?redirect=/session/${code}`)}
            className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm hover:bg-red-500 transition"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
          >
            Iniciar Sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      {/* Scanline bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.012) 3px, rgba(239,68,68,0.012) 4px)' }} />

      <div className="relative flex flex-col items-center gap-y-6 text-center max-w-sm">
        <div style={{ clipPath: GAMER_CUT }}
          className="w-24 h-24 bg-red-900/20 flex items-center justify-center border border-red-900/40">
          {(isConnecting || autoJoining) && !joined ? (
            <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : joined ? (
            <span className="text-red-400 text-3xl">✓</span>
          ) : (
            <HiSignal size={36} className="text-red-500" />
          )}
        </div>

        <div>
          <p className="text-[10px] font-mono text-red-400/70 uppercase tracking-widest mb-1">Código</p>
          <p className="text-white font-black text-3xl tracking-widest font-mono">{code}</p>
        </div>

        {error && (
          <div className="border border-red-900/40 bg-red-900/10 px-4 py-3 w-full">
            <p className="text-red-400 text-xs font-mono">⚠ {error}</p>
            <button
              onClick={() => router.push('/')}
              className="text-[10px] text-neutral-500 hover:text-white transition mt-2 font-mono uppercase tracking-widest"
            >
              Voltar ao início →
            </button>
          </div>
        )}

        {joined && (
          <p className="text-green-400 text-xs font-mono uppercase tracking-widest animate-pulse">
            ✓ Entraste! A redirecionar...
          </p>
        )}

        {isConnecting && !joined && (
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest animate-pulse">
            A entrar na sessão...
          </p>
        )}
      </div>
    </div>
  );
}