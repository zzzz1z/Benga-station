'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@/hooks/useUser';
import { SessionMember } from '@/hooks/useSession';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { IoClose, IoCopy, IoLink, IoPeople, IoShield, IoShieldOutline, IoLogOut } from 'react-icons/io5';
import { HiSignal } from 'react-icons/hi2';
import { useSessionContext } from '@/providers/SessionContext';

interface SessionPanelProps {
  onClose: () => void;
}

const BADGE_CUT = "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)";

const MemberCard = ({
  member,
  isMe,
  isSessionHost,
  onTogglePermission,
}: {
  member: SessionMember;
  isMe: boolean;
  isSessionHost: boolean;
  onTogglePermission?: (userId: string, granted: boolean) => void;
}) => {
  const initials = member.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-x-3 py-2 px-3 border border-red-900/20 bg-neutral-900/60 relative group">
      <div
        className="relative h-9 w-9 flex-shrink-0 overflow-hidden border border-red-900/40"
        style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}
      >
        {member.avatarUrl ? (
          <Image fill src={member.avatarUrl} alt={member.fullName} className="object-cover" sizes="36px" unoptimized />
        ) : (
          <div className="w-full h-full bg-red-900/30 flex items-center justify-center">
            <span className="text-red-400 text-xs font-black">{initials}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-x-1.5">
          <span className="text-white text-xs font-bold uppercase tracking-tight truncate">
            {member.fullName}
          </span>
          {isMe && (
            <span className="text-[9px] text-red-400 font-mono uppercase tracking-widest">EU</span>
          )}
        </div>
        <span
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: member.isHost ? '#f87171' : '#525252' }}
        >
          {member.isHost ? '◆ CO-HOST' : '● OUVINTE'}
        </span>
      </div>

      {isSessionHost && !isMe && onTogglePermission && (
        <button
          onClick={() => onTogglePermission(member.userId, !member.isHost)}
          className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-red-400 text-neutral-600"
          title={member.isHost ? 'Remover permissão' : 'Dar permissão de controlo'}
        >
          {member.isHost
            ? <IoShield size={16} className="text-red-400" />
            : <IoShieldOutline size={16} />
          }
        </button>
      )}
    </div>
  );
};

const PanelContent: React.FC<SessionPanelProps> = ({ onClose }) => {
  const { user } = useUser();
  const { session, isConnecting, error, createSession, joinSession, leave, grantPermission } = useSessionContext();
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState<'home' | 'join'>('home');

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCreate = async () => {
    const code = await createSession();
    if (code) toast.success('Sessão criada!');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const ok = await joinSession(joinCode);
    if (!ok) return;
    toast.success('Entraste na sessão!');
  };

  const handleCopyCode = () => {
    if (!session?.code) return;
    navigator.clipboard.writeText(session.code);
    toast.success('Código copiado!');
  };

  const handleCopyLink = () => {
    if (!session?.code) return;
navigator.clipboard.writeText(`${window.location.origin}/session?code=${session.code}`);
    toast.success('Link copiado!');
  };

  const handleLeave = async () => {
    await leave();
    setJoinCode('');
    toast('Saíste da sessão.', { icon: '👋' });
  };

  const formatCode = (raw: string) => {
    const cleaned = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 9);
    if (cleaned.length > 5) return `BENGA-${cleaned.slice(cleaned.startsWith('BENGA') ? 5 : 0, 9)}`;
    return cleaned;
  };

  return (
    // Full-screen overlay — outside all player/sidebar stacking contexts
    <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full md:w-[440px] md:max-h-[85vh] bg-neutral-950 border border-red-900/40 flex flex-col"
        style={{
          boxShadow: '0 0 40px rgba(239,68,68,0.15), 0 0 1px rgba(239,68,68,0.4)',
        }}
        // Stop clicks inside the panel from closing it
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-px w-full flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-x-2">
            <HiSignal size={18} className="text-red-500" />
            <span className="text-white font-black uppercase tracking-widest text-sm">Sessão Conjunta</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition">
            <IoClose size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 pb-6 flex flex-col gap-y-4 overflow-y-auto flex-1">

          {session ? (
            <>
              <div className="border border-red-900/30 bg-red-900/5 p-4 flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-red-400/70 font-mono uppercase tracking-widest mb-1">Código da sessão</p>
                    <p className="text-white font-black text-2xl tracking-widest font-mono">{session.code}</p>
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-red-900/40 text-red-400 hover:bg-red-900/20 transition"
                      style={{ clipPath: BADGE_CUT }}
                    >
                      <IoCopy size={12} /> Código
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-x-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-red-900/40 text-red-400 hover:bg-red-900/20 transition"
                      style={{ clipPath: BADGE_CUT }}
                    >
                      <IoLink size={12} /> Link
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">
                    {session.isHost ? 'HOST' : session.canControl ? 'CO-HOST' : 'OUVINTE'} · AO VIVO
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-x-2 mb-2">
                  <IoPeople size={14} className="text-red-500/60" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    {session.members.length} {session.members.length === 1 ? 'Ouvinte' : 'Ouvintes'}
                  </span>
                </div>
                <div className="flex flex-col gap-y-1.5">
                  {session.members.map(member => (
                    <MemberCard
                      key={member.userId}
                      member={member}
                      isMe={member.userId === user?.id}
                      isSessionHost={session.isHost}
                      onTogglePermission={session.isHost ? grantPermission : undefined}
                    />
                  ))}
                </div>
              </div>

              {session.isHost && (
                <p className="text-[10px] text-neutral-600 font-mono leading-relaxed">
                  Passa o rato sobre um membro para dar / remover permissão de controlo.
                </p>
              )}

              <button
                onClick={handleLeave}
                className="flex items-center justify-center gap-x-2 w-full py-2.5 border border-red-900/40 text-red-400 hover:bg-red-900/10 transition text-xs font-black uppercase tracking-widest"
              >
                <IoLogOut size={16} />
                {session.isHost && session.members.length > 1 ? 'Transferir e Sair' : 'Sair da Sessão'}
              </button>
            </>
          ) : (
            <>
              {view === 'home' && (
                <div className="flex flex-col gap-y-3">
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Ouve música em sincronia com os teus amigos em tempo real.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={isConnecting}
                    className="w-full py-3 bg-red-600/90 hover:bg-red-600 transition text-white font-black uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-x-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        A criar...
                      </span>
                    ) : '+ Criar Sessão'}
                  </button>
                  <button
                    onClick={() => setView('join')}
                    className="w-full py-3 border border-red-900/40 text-red-400 hover:bg-red-900/10 transition font-black uppercase tracking-widest text-sm"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}
                  >
                    Entrar numa Sessão
                  </button>
                </div>
              )}

              {view === 'join' && (
                <div className="flex flex-col gap-y-3">
                  <button
                    onClick={() => setView('home')}
                    className="text-[10px] text-neutral-500 hover:text-white transition uppercase tracking-widest font-mono text-left"
                  >
                    ← Voltar
                  </button>
                  <div className="flex flex-col gap-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Código ou Link
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(formatCode(e.target.value))}
                      placeholder="BENGA-XXXX"
                      className="bg-neutral-900 border border-red-900/40 text-white font-mono text-sm px-3 py-2.5 outline-none focus:border-red-500/60 placeholder:text-neutral-700 uppercase tracking-widest"
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={isConnecting || !joinCode.trim()}
                    className="w-full py-3 bg-red-600/90 hover:bg-red-600 transition text-white font-black uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-x-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        A entrar...
                      </span>
                    ) : 'Entrar'}
                  </button>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-xs font-mono border border-red-900/40 px-3 py-2 bg-red-900/10">
                  ⚠ {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bottom accent */}
        <div className="h-px w-full flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
      </div>
    </div>
  );
};

// Portal wrapper — renders outside the player DOM tree entirely
const SessionPanel: React.FC<SessionPanelProps> = ({ onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(<PanelContent onClose={onClose} />, document.body);
};

export default SessionPanel;