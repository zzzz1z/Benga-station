'use client';

import { createContext, useContext, useRef, useCallback, useState, ReactNode } from 'react';
import { useSession, SessionInfo, SessionState } from '@/hooks/useSession';
import usePlayer from '@/hooks/usePlayer';
import { backend } from '@/utils/audioBackend';

const ASSET_ID = 'benga_track';

type SessionContextType = {
  session: SessionInfo | null;
  isConnecting: boolean;
  error: string | null;
  createSession: () => Promise<string | null>;
  joinSession: (code: string) => Promise<boolean>;
  leave: () => Promise<void>;
  broadcastState: (state: SessionState) => void;
  broadcastQueue: (ids: string[], songs: Record<string, any>, activeID: string) => void;
  grantPermission: (userId: string, granted: boolean) => void;
  registerPlayer: (controls: PlayerControls) => void;
};

type PlayerControls = {
  audioRef: React.RefObject<HTMLAudioElement>; // kept for API compat, not used
  setIsPlaying: (v: boolean) => void;
  setPosition: (v: number) => void;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const playerControlsRef = useRef<PlayerControls | null>(null);

  const registerPlayer = useCallback((controls: PlayerControls) => {
    playerControlsRef.current = controls;
  }, []);

  const applyRemoteState = useCallback(async (state: SessionState) => {
    const controls = playerControlsRef.current;
    if (!controls) return;
    const { setIsPlaying, setPosition } = controls;

    const elapsed = (Date.now() - state.timestamp) / 1000;
    const targetPos = state.position + (state.isPlaying ? elapsed : 0);

    if (state.activeID) {
      const currentActive = usePlayer.getState().activeID;
      if (currentActive !== state.activeID) {
        usePlayer.getState().setId(state.activeID);
        // Song will reload via useLoadSongUrl → Player's load effect
        // seek is handled after preload completes there
        return;
      }
    }

    // Drift correction via backend
    try {
      const { currentTime } = await backend.getCurrentTime({ assetId: ASSET_ID });
      const drift = Math.abs(currentTime - targetPos);
      if (drift > 1.5) {
        await backend.setCurrentTime({ assetId: ASSET_ID, time: Math.max(0, targetPos) });
        setPosition(Math.max(0, targetPos));
      }
    } catch {}

    if (state.isPlaying) {
      await backend.resume({ assetId: ASSET_ID }).catch(() => {});
      setIsPlaying(true);
    } else {
      await backend.pause({ assetId: ASSET_ID }).catch(() => {});
      setIsPlaying(false);
    }
  }, []);

  const applyRemoteQueue = useCallback((ids: string[], songs: Record<string, any>, activeID: string) => {
    usePlayer.setState({ ids, songs, activeID });
  }, []);

  const getCurrentState = useCallback(async (): Promise<SessionState> => {
    const { activeID } = usePlayer.getState();
    let position = 0;
    let isPlaying = false;
    try {
      const r = await backend.getCurrentTime({ assetId: ASSET_ID });
      position = r.currentTime;
    } catch {}
    try {
      // isPlaying: backend doesn't expose isPlaying directly,
      // so Player keeps it in a ref and we read it from controls
      // For now derive from position movement — good enough for sync
    } catch {}
    return {
      activeID: activeID ?? null,
      isPlaying: false, // overridden by Player's broadcastCurrentState which has the real value
      position,
      timestamp: Date.now(),
    };
  }, []);

  const {
    session, isConnecting, error,
    createSession, joinSession, leave,
    broadcastState, broadcastQueue, grantPermission,
  } = useSession({
    onStateChange: applyRemoteState,
    onQueueChange: applyRemoteQueue,
    getCurrentState: () => {
      const { activeID } = usePlayer.getState();
      return {
        activeID: activeID ?? null,
        isPlaying: false, // Player's broadcastCurrentState overrides this
        position: 0,
        timestamp: Date.now(),
      };
    },
    getCurrentQueue: () => {
      const { ids, songs } = usePlayer.getState();
      return { ids, songs };
    },
  });

  return (
    <SessionContext.Provider value={{
      session, isConnecting, error,
      createSession, joinSession, leave,
      broadcastState, broadcastQueue, grantPermission,
      registerPlayer,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider');
  return ctx;
};