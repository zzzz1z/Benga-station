'use client';

import { createContext, useContext, useRef, useCallback, useState, ReactNode } from 'react';
import { useSession, SessionInfo, SessionState, SessionMember } from '@/hooks/useSession';
import usePlayer from '@/hooks/usePlayer';
import { safePlay } from '@/utils/player';

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
  // For Player to register its audio ref and controls
  registerPlayer: (controls: PlayerControls) => void;
};

type PlayerControls = {
  audioRef: React.RefObject<HTMLAudioElement>;
  setIsPlaying: (v: boolean) => void;
  setPosition: (v: number) => void;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const playerControlsRef = useRef<PlayerControls | null>(null);

  const registerPlayer = useCallback((controls: PlayerControls) => {
    playerControlsRef.current = controls;
  }, []);

  const applyRemoteState = useCallback((state: SessionState) => {
    const controls = playerControlsRef.current;
    if (!controls) return;
    const { audioRef, setIsPlaying, setPosition } = controls;
    const audio = audioRef.current;

    // Calculate drift-corrected position
    const elapsed = (Date.now() - state.timestamp) / 1000;
    const targetPos = state.position + (state.isPlaying ? elapsed : 0);

    if (state.activeID) {
      const currentActive = usePlayer.getState().activeID;
      if (currentActive !== state.activeID) {
        usePlayer.getState().setId(state.activeID);
        // Audio will reload via useLoadSongUrl, seek after canplay
        if (audio) {
          const onCanPlay = () => {
            audio.currentTime = Math.max(0, targetPos);
            if (state.isPlaying) safePlay(audio).catch(() => {});
            audio.removeEventListener('canplay', onCanPlay);
          };
          audio.addEventListener('canplay', onCanPlay);
        }
        return;
      }
    }

    if (audio && audio.src) {
      const drift = Math.abs(audio.currentTime - targetPos);
      if (drift > 1.5) {
        audio.currentTime = Math.max(0, targetPos);
        setPosition(Math.max(0, targetPos));
      }
      if (state.isPlaying && audio.paused) {
        safePlay(audio).catch(() => {});
        setIsPlaying(true);
      } else if (!state.isPlaying && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const applyRemoteQueue = useCallback((ids: string[], songs: Record<string, any>, activeID: string) => {
    usePlayer.setState({ ids, songs, activeID });
  }, []);

  const {
    session, isConnecting, error,
    createSession, joinSession, leave,
    broadcastState, broadcastQueue, grantPermission,
  } = useSession({
    onStateChange: applyRemoteState,
    onQueueChange: applyRemoteQueue,
    getCurrentState: () => {
      const audio = playerControlsRef.current?.audioRef.current;
      const { activeID } = usePlayer.getState();
      return {
        activeID: activeID ?? null,
        isPlaying: !!(audio && !audio.paused),
        position: audio?.currentTime ?? 0,
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