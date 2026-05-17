'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/hooks/useUser';

const supabase = createClient();

export type SessionMember = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  isHost: boolean;
  joinedAt: number;
};

export type SessionState = {
  activeID: string | null;
  isPlaying: boolean;
  position: number;
  timestamp: number; // when this state was sent (Date.now())
};

export type SessionInfo = {
  code: string;
  isHost: boolean;
  members: SessionMember[];
  canControl: boolean; // host or granted permission
};

type BroadcastEvent =
  | { type: 'playback_state'; payload: SessionState }
  | { type: 'queue_change'; payload: { ids: string[]; songs: Record<string, any>; activeID: string } }
  | { type: 'permission_grant'; payload: { userId: string; granted: boolean } }
  | { type: 'host_change'; payload: { newHostId: string } }
  | { type: 'sync_request'; payload: { requesterId: string } }
  | { type: 'sync_response'; payload: SessionState & { ids: string[]; songs: Record<string, any> } };

type UseSessionOptions = {
  onStateChange?: (state: SessionState) => void;
  onQueueChange?: (ids: string[], songs: Record<string, any>, activeID: string) => void;
  onHostChange?: (newHostId: string) => void;
  onPermissionChange?: (canControl: boolean) => void;
  getCurrentState?: () => SessionState;
  getCurrentQueue?: () => { ids: string[]; songs: Record<string, any> };
};

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BENGA-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const useSession = (options: UseSessionOptions = {}) => {
  const { user, userDetails } = useUser();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionRef = useRef<SessionInfo | null>(null);
  const membersRef = useRef<Map<string, SessionMember>>(new Map());
  const optionsRef = useRef(options);

  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const updateMembers = useCallback(() => {
    const members = Array.from(membersRef.current.values())
      .sort((a, b) => a.joinedAt - b.joinedAt);

    setSession(prev => prev ? { ...prev, members } : null);
  }, []);

  const broadcast = useCallback((event: BroadcastEvent) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: event.type,
      payload: event.payload,
    });
  }, []);

  const leave = useCallback(async () => {
    if (!channelRef.current) return;

    // If host is leaving, transfer to earliest joiner
    const s = sessionRef.current;
    if (s?.isHost && s.members.length > 1 && user) {
      const nextHost = s.members.find(m => m.userId !== user.id);
      if (nextHost) {
        broadcast({ type: 'host_change', payload: { newHostId: nextHost.userId } });
        // Update DB
        await supabase
          .from('sessions')
          .update({ host_id: nextHost.userId })
          .eq('code', s.code);
      } else {
        // Last person — delete session
        await supabase.from('sessions').delete().eq('code', s.code);
      }
    }

    await supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    membersRef.current.clear();
    setSession(null);
    setError(null);
  }, [user, broadcast]);

  const connectToChannel = useCallback((code: string, isHost: boolean) => {
    if (!user || !userDetails) return;

    const me: SessionMember = {
      userId: user.id,
      fullName: userDetails.full_name || userDetails.email || 'Anónimo',
      avatarUrl: userDetails.avatar_url || null,
      isHost,
      joinedAt: Date.now(),
    };

    // Add self to members map
    membersRef.current.set(user.id, me);

    const channel = supabase.channel(`session:${code}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<SessionMember>();
        const newMap = new Map<string, SessionMember>();

        // Always keep self
        newMap.set(user.id, membersRef.current.get(user.id) ?? me);

        Object.entries(state).forEach(([, presences]) => {
          const p = presences[0] as SessionMember;
          if (p?.userId && p.userId !== user.id) {
            newMap.set(p.userId, p);
          }
        });

        membersRef.current = newMap;
        updateMembers();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: any) => {
          if (p.userId && p.userId !== user.id) {
            membersRef.current.set(p.userId, p as SessionMember);
          }
        });
        updateMembers();

        // If I'm host, send them current state
        if (sessionRef.current?.isHost) {
          setTimeout(() => {
            const state = optionsRef.current.getCurrentState?.();
            const queue = optionsRef.current.getCurrentQueue?.();
            if (state && queue) {
              broadcast({
                type: 'sync_response',
                payload: { ...state, ...queue },
              });
            }
          }, 500);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: any) => {
          if (p.userId) membersRef.current.delete(p.userId);
        });
        updateMembers();
      })
      .on('broadcast', { event: 'playback_state' }, ({ payload }) => {
        if (!sessionRef.current?.canControl) {
          optionsRef.current.onStateChange?.(payload as SessionState);
        }
      })
      .on('broadcast', { event: 'queue_change' }, ({ payload }) => {
        if (!sessionRef.current?.isHost) {
          const p = payload as { ids: string[]; songs: Record<string, any>; activeID: string };
          optionsRef.current.onQueueChange?.(p.ids, p.songs, p.activeID);
        }
      })
      .on('broadcast', { event: 'permission_grant' }, ({ payload }) => {
        const p = payload as { userId: string; granted: boolean };
        if (p.userId === user.id) {
          setSession(prev => prev ? { ...prev, canControl: p.granted } : null);
          optionsRef.current.onPermissionChange?.(p.granted);
        }
        // Update member in map
        const member = membersRef.current.get(p.userId);
        if (member) {
          membersRef.current.set(p.userId, { ...member, isHost: p.granted });
          updateMembers();
        }
      })
      .on('broadcast', { event: 'host_change' }, ({ payload }) => {
        const p = payload as { newHostId: string };
        const amNewHost = p.newHostId === user.id;

        // Update all members' isHost
        membersRef.current.forEach((m, id) => {
          membersRef.current.set(id, { ...m, isHost: id === p.newHostId });
        });

        setSession(prev => prev
          ? { ...prev, isHost: amNewHost, canControl: amNewHost }
          : null
        );

        optionsRef.current.onHostChange?.(p.newHostId);
        updateMembers();
      })
      .on('broadcast', { event: 'sync_request' }, ({ payload }) => {
        const p = payload as { requesterId: string };
        if (sessionRef.current?.isHost) {
          const state = optionsRef.current.getCurrentState?.();
          const queue = optionsRef.current.getCurrentQueue?.();
          if (state && queue) {
            broadcast({ type: 'sync_response', payload: { ...state, ...queue } });
          }
        }
      })
      .on('broadcast', { event: 'sync_response' }, ({ payload }) => {
        if (!sessionRef.current?.isHost) {
          const p = payload as SessionState & { ids: string[]; songs: Record<string, any> };
          optionsRef.current.onStateChange?.(p);
          optionsRef.current.onQueueChange?.(p.ids, p.songs, p.activeID ?? '');
        }
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          ...me,
          joinedAt: me.joinedAt,
        });

        // If guest, request current state
        if (!isHost) {
          setTimeout(() => {
            broadcast({ type: 'sync_request', payload: { requesterId: user.id } });
          }, 800);
        }

        setIsConnecting(false);

        const sessionInfo: SessionInfo = {
          code,
          isHost,
          members: [me],
          canControl: isHost,
        };
        setSession(sessionInfo);
        sessionRef.current = sessionInfo;
      } else if (status === 'CHANNEL_ERROR') {
        setError('Falha ao conectar à sessão.');
        setIsConnecting(false);
      }
    });

    channelRef.current = channel;
  }, [user, userDetails, broadcast, updateMembers]);

  const createSession = useCallback(async () => {
    if (!user) { setError('Tens de estar autenticado.'); return null; }
    setIsConnecting(true);
    setError(null);

    const code = generateCode();

    const { error: dbErr } = await supabase
      .from('sessions')
      .insert({ code, host_id: user.id });

    if (dbErr) {
      setError('Erro ao criar sessão.');
      setIsConnecting(false);
      return null;
    }

    connectToChannel(code, true);
    return code;
  }, [user, connectToChannel]);

  const joinSession = useCallback(async (code: string) => {
    if (!user) { setError('Tens de estar autenticado.'); return false; }
    setIsConnecting(true);
    setError(null);

    const normalized = code.trim().toUpperCase();

    const { data, error: dbErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', normalized)
      .maybeSingle();

    if (dbErr || !data) {
      setError('Sessão não encontrada. Verifica o código.');
      setIsConnecting(false);
      return false;
    }

    const isExpired = new Date(data.expires_at) < new Date();
    if (isExpired) {
      setError('Esta sessão já expirou.');
      setIsConnecting(false);
      return false;
    }

    connectToChannel(normalized, false);
    return true;
  }, [user, connectToChannel]);

  const broadcastState = useCallback((state: SessionState) => {
    if (!sessionRef.current?.canControl) return;
    broadcast({ type: 'playback_state', payload: state });
  }, [broadcast]);

  const broadcastQueue = useCallback((ids: string[], songs: Record<string, any>, activeID: string) => {
    if (!sessionRef.current?.isHost) return;
    broadcast({ type: 'queue_change', payload: { ids, songs, activeID } });
  }, [broadcast]);

  const grantPermission = useCallback((userId: string, granted: boolean) => {
    if (!sessionRef.current?.isHost) return;
    broadcast({ type: 'permission_grant', payload: { userId, granted } });
    // Update local member state
    const member = membersRef.current.get(userId);
    if (member) {
      membersRef.current.set(userId, { ...member, isHost: granted });
      updateMembers();
    }
    setSession(prev => prev
      ? { ...prev, members: prev.members.map(m => m.userId === userId ? { ...m, isHost: granted } : m) }
      : null
    );
  }, [broadcast, updateMembers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    session,
    isConnecting,
    error,
    createSession,
    joinSession,
    leave,
    broadcastState,
    broadcastQueue,
    grantPermission,
  };
};