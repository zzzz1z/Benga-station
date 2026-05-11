import { useEffect, useRef } from "react";
import { Song } from "@/types";
import usePlayer from "./usePlayer";

let audioCtx: AudioContext | null = null;

async function unlockAudioContext(): Promise<void> {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
  } catch {}
}

const getArtworkUrl = (song: Song): string => {
  if (!song?.image_path) return '';
  if (song.source === 'youtube' || song.image_path.startsWith('http')) {
    return song.image_path;
  }
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/imagens/${song.image_path}`;
};

const useMediaSession = (
  isPlaying: boolean,
  song: Song,
  audioRef: React.RefObject<HTMLAudioElement>,
  onPlay: () => void,
  onPause: () => void
) => {
  const player = usePlayer();
  const playerRef = useRef(player);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const reassertHandlers = () => {
    if (!("mediaSession" in navigator)) return;
    const audio = audioRef.current;

    navigator.mediaSession.setActionHandler("play", async () => {
      await unlockAudioContext();
      onPlayRef.current();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      onPauseRef.current();
    });

    navigator.mediaSession.setActionHandler("previoustrack", async () => {
      await unlockAudioContext();
      if (!audio) return;
      if (audio.currentTime > 3) {
        audio.currentTime = 0;
      } else {
        playerRef.current.playPrevious();
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", async () => {
      await unlockAudioContext();
      playerRef.current.playNext();
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (!audio || details.seekTime === undefined) return;
      audio.currentTime = details.seekTime;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: details.seekTime,
        });
      } catch {}
    });
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!song?.title) return;

    const artworkUrl = getArtworkUrl(song);
    const artwork: MediaImage[] = artworkUrl
      ? [
          { src: artworkUrl, sizes: "96x96",   type: "image/jpeg" },
          { src: artworkUrl, sizes: "128x128", type: "image/jpeg" },
          { src: artworkUrl, sizes: "192x192", type: "image/jpeg" },
          { src: artworkUrl, sizes: "256x256", type: "image/jpeg" },
          { src: artworkUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.author,
      album: "Benga Station",
      artwork,
    });

    reassertHandlers();

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const audio = audioRef.current;
    if (!audio) return;

    const updatePosition = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch {}
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      reassertHandlers();
      if (isPlayingRef.current && audio.paused) {
        await unlockAudioContext();
        audio.play().catch(() => {});
      }
    };

    const handlePageShow = async () => {
      reassertHandlers();
      if (isPlayingRef.current && audio.paused) {
        await unlockAudioContext();
        audio.play().catch(() => {});
      }
    };

    const handleStalled = () => {
      setTimeout(async () => {
        if (isPlayingRef.current && audio.paused && audio.src) {
          await unlockAudioContext();
          audio.play().catch(() => {});
        }
      }, 800);
    };

    audio.addEventListener("timeupdate", updatePosition);
    audio.addEventListener("loadedmetadata", updatePosition);
    audio.addEventListener("stalled", handleStalled);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      audio.removeEventListener("timeupdate", updatePosition);
      audio.removeEventListener("loadedmetadata", updatePosition);
      audio.removeEventListener("stalled", handleStalled);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef, song]);
};

export default useMediaSession;