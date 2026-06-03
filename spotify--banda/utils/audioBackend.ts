import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capgo/native-audio';

export const IS_NATIVE = Capacitor.isNativePlatform();

// ─── Web audio singleton ──────────────────────────────────────────────────────
let _audio: HTMLAudioElement | null = null;
const getAudio = (): HTMLAudioElement => {
  if (!_audio) _audio = new Audio();
  return _audio;
};

const ASSET_ID = 'benga_track';

// ─── AudioContext unlock ──────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
const unlockAudioContext = async () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  } catch {}
};

const safePlay = async (a: HTMLAudioElement) => {
  await unlockAudioContext();
  try {
    await a.play();
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'NotSupportedError') {
      await new Promise(r => setTimeout(r, 300));
      await unlockAudioContext();
      await a.play().catch(() => {});
    }
  }
};

// ─── Keepalive ────────────────────────────────────────────────────────────────
const SILENT_SRC = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';
let silentAudio: HTMLAudioElement | null = null;

const startKeepalive = () => {
  if (!silentAudio) {
    silentAudio = new Audio();
    silentAudio.src = SILENT_SRC;
    silentAudio.loop = true;
    silentAudio.volume = 0.001;
  }
  silentAudio.play().catch(() => {});
};

const stopKeepalive = () => {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.currentTime = 0;
  }
};

// ─── Callback registry (survives audio element recreation) ───────────────────
const _cbs: {
  complete?: (data: any) => void;
  playbackState?: (data: any) => void;
} = {};

const attachElementListeners = (a: HTMLAudioElement) => {
  a.addEventListener('ended', () => {
    _cbs.complete?.({ assetId: ASSET_ID });
    _cbs.playbackState?.({ assetId: ASSET_ID, state: 'completed' });
  });
  a.addEventListener('play',  () => _cbs.playbackState?.({ assetId: ASSET_ID, state: 'playing' }));
  a.addEventListener('pause', () => _cbs.playbackState?.({ assetId: ASSET_ID, state: 'paused'  }));
};

// ─── Web shims ────────────────────────────────────────────────────────────────

const webConfigure = async (_opts?: any): Promise<void> => {};

const webPreload = async (opts: any): Promise<void> => {
  const a = getAudio();
  a.src = opts.assetPath;
  a.load();

  attachElementListeners(a);

  if ('mediaSession' in navigator && opts.notificationMetadata) {
    const m = opts.notificationMetadata;
    navigator.mediaSession.metadata = new MediaMetadata({
      title:   m.title  ?? '',
      artist:  m.artist ?? '',
      album:   m.album  ?? '',
      artwork: m.artworkUrl ? [{ src: m.artworkUrl }] : [],
    });
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('preload timeout')), 35000);

    const onCanPlay = () => {
      clearTimeout(timeout);
      resolve();
    };

    const onError = async () => {
      // If it's a YouTube stream, force re-extract then retry once
      const isYT = opts.assetPath?.includes('/api/youtube/stream');
      if (isYT) {
        try {
          const videoId = new URL(opts.assetPath).searchParams.get('videoId');
          if (videoId) {
            // Tell the worker to bust the cache and re-extract
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoId, force: true }),
            });
          }
        } catch {}
        // Small delay for worker to finish extraction, then retry
        setTimeout(() => {
          a.addEventListener('canplay', onCanPlay, { once: true });
          a.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('stream unavailable after retry'));
          }, { once: true });
          a.load();
        }, 3000);
      } else {
        clearTimeout(timeout);
        reject(new Error('audio error'));
      }
    };

    a.addEventListener('canplay', onCanPlay, { once: true });
    a.addEventListener('error', onError, { once: true });
  });
};

const webPlay = async (_opts?: any): Promise<void> => {
  startKeepalive();
  await safePlay(getAudio());
};

const webResume = async (_opts?: any): Promise<void> => {
  startKeepalive();
  await safePlay(getAudio());
};

const webPause = async (_opts?: any): Promise<void> => {
  getAudio().pause();
  stopKeepalive();
};

const webStop = async (_opts?: any): Promise<void> => {
  const a = getAudio();
  a.pause();
  a.currentTime = 0;
  stopKeepalive();
};

const webUnload = async (_opts?: any): Promise<void> => {
  if (_audio) { _audio.src = ''; _audio = null; }
  stopKeepalive();
};

const webSeek   = async ({ time }:   any): Promise<void> => { getAudio().currentTime = time; };
const webVolume = async ({ volume }: any): Promise<void> => { getAudio().volume = volume; };

const webDuration    = async (_opts?: any) => ({ duration:    getAudio().duration    ?? 0 });
const webCurrentTime = async (_opts?: any) => ({ currentTime: getAudio().currentTime ?? 0 });

const webAddListener = (event: string, cb: (data: any) => void) => {
  if (event === 'complete') {
    _cbs.complete = cb;
    return Promise.resolve({ remove: () => { delete _cbs.complete; } });
  }

  if (event === 'currentTime') {
    const interval = setInterval(() => {
      const current = getAudio();
      if (current.paused || !current.src) return;
      cb({
        assetId:     ASSET_ID,
        currentTime: current.currentTime,
        duration:    isFinite(current.duration) ? current.duration : 0,
      });
    }, 500);
    return Promise.resolve({ remove: () => clearInterval(interval) });
  }

  if (event === 'playbackState') {
    _cbs.playbackState = cb;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play',          () => cb({ assetId: ASSET_ID, state: 'playing'       }));
      navigator.mediaSession.setActionHandler('pause',         () => cb({ assetId: ASSET_ID, state: 'paused'        }));
      navigator.mediaSession.setActionHandler('nexttrack',     () => cb({ assetId: ASSET_ID, state: 'nextTrack'     }));
      navigator.mediaSession.setActionHandler('previoustrack', () => cb({ assetId: ASSET_ID, state: 'previousTrack' }));
    }

    return Promise.resolve({
      remove: () => {
        delete _cbs.playbackState;
        if ('mediaSession' in navigator) {
          (['play', 'pause', 'nexttrack', 'previoustrack'] as MediaSessionAction[])
            .forEach(action => navigator.mediaSession.setActionHandler(action, null));
        }
      },
    });
  }

  return Promise.resolve({ remove: () => {} });
};

// ─── Unified backend ──────────────────────────────────────────────────────────
export const backend = IS_NATIVE
  ? {
      configure:      NativeAudio.configure.bind(NativeAudio),
      preload:        NativeAudio.preload.bind(NativeAudio),
      play:           NativeAudio.play.bind(NativeAudio),
      pause:          NativeAudio.pause.bind(NativeAudio),
      resume:         NativeAudio.resume.bind(NativeAudio),
      stop:           NativeAudio.stop.bind(NativeAudio),
      unload:         NativeAudio.unload.bind(NativeAudio),
      setCurrentTime: NativeAudio.setCurrentTime.bind(NativeAudio),
      setVolume:      NativeAudio.setVolume.bind(NativeAudio),
      getDuration:    NativeAudio.getDuration.bind(NativeAudio),
      getCurrentTime: NativeAudio.getCurrentTime.bind(NativeAudio),
      addListener:    NativeAudio.addListener.bind(NativeAudio),
    }
  : {
      configure:      webConfigure,
      preload:        webPreload,
      play:           webPlay,
      pause:          webPause,
      resume:         webResume,
      stop:           webStop,
      unload:         webUnload,
      setCurrentTime: webSeek,
      setVolume:      webVolume,
      getDuration:    webDuration,
      getCurrentTime: webCurrentTime,
      addListener:    webAddListener,
    };