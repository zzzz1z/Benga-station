let audioCtx: AudioContext | null = null;

export async function unlockAudioContext(): Promise<void> {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  } catch {}
}

export async function safePlay(audio: HTMLAudioElement): Promise<void> {
  await unlockAudioContext();
  try {
    await audio.play();
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'NotSupportedError') {
      await new Promise(r => setTimeout(r, 300));
      await unlockAudioContext();
      await audio.play().catch(() => {});
    }
  }
}

let silentAudio: HTMLAudioElement | null = null;
const SILENT_SRC = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';

export function startKeepalive(keepaliveActiveRef: React.MutableRefObject<boolean>) {
  if (!silentAudio) {
    silentAudio = new Audio();
    silentAudio.src = SILENT_SRC;
    silentAudio.loop = true;
    silentAudio.volume = 0.001;
  }
  keepaliveActiveRef.current = true;
  silentAudio.play().catch(() => {});
}

export function stopKeepalive(keepaliveActiveRef: React.MutableRefObject<boolean>) {
  keepaliveActiveRef.current = false;
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.currentTime = 0;
  }
}





// utils/player.ts
// AudioContext / keepalive / safePlay removed — NativeAudio handles all of that natively.

export function preextractWindow(activeID: string, ids: string[]) {
  const idx = ids.indexOf(activeID);
  if (idx === -1) return;
  const ytWindow = [
    ...ids.slice(Math.max(0, idx - 3), idx),
    ...ids.slice(idx + 1, idx + 6),
  ].filter(id => id.startsWith('yt_')).map(id => id.slice(3));
  if (!ytWindow.length) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds: ytWindow }),
  }).catch(() => {});
}

export async function fetchHeaderDuration(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const cd = res.headers.get('Content-Duration') || res.headers.get('X-Content-Duration');
    if (cd) {
      const parsed = parseFloat(cd);
      if (parsed && !isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return null;
}