import { useEffect, useRef } from "react";
import { Song } from "@/types";
import usePlayer from "./usePlayer";

const useMediaSession = (
  isPlaying: boolean,
  song: Song,
  audioRef: React.RefObject<HTMLAudioElement>,
  play: () => void,
  pause: () => void
) => {
  const player = usePlayer();
  // Stable refs so handlers never go stale without re-registering
  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  // playerRef fixes stale closure — playNext/playPrevious read Zustand state
  // at call time, so without this iOS gets the queue from the first render only
  const playerRef = useRef(player);
  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { pauseRef.current = pause; }, [pause]);
  useEffect(() => { playerRef.current = player; }, [player]);

  // Register handlers once per song change only
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const imagePath = song.image_path
      ? `storage/v1/object/public/imagens/${song.image_path}`
      : "";
    const artwork = imagePath
      ? [
          { src: `${baseUrl}/${imagePath}`, sizes: "96x96",   type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "128x128", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "192x192", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "256x256", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "512x512", type: "image/jpeg" },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.author,
      album: "Benga Station",
      artwork,
    });

    // Use stable refs so iOS doesn't get stale closures
    navigator.mediaSession.setActionHandler("play", () => playRef.current());
    navigator.mediaSession.setActionHandler("pause", () => pauseRef.current());

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        // Tell iOS the position jumped immediately so scrubber doesn't snap back
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: 0,
          });
        } catch {}
      } else {
        playerRef.current.playPrevious();
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      playerRef.current.playNext();
    });

    // iOS lock screen scrubber — without these it shows no seek bar
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      const audio = audioRef.current;
      if (audio && details.seekTime !== undefined) {
        audio.currentTime = details.seekTime;
        // Must confirm position back to iOS immediately or it snaps back
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: details.seekTime,
          });
        } catch {}
      }
    });

    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const audio = audioRef.current;
      if (audio) {
        const newTime = Math.min(audio.currentTime + (details.seekOffset ?? 10), audio.duration);
        audio.currentTime = newTime;
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: newTime,
          });
        } catch {}
      }
    });

    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const audio = audioRef.current;
      if (audio) {
        const newTime = Math.max(audio.currentTime - (details.seekOffset ?? 10), 0);
        audio.currentTime = newTime;
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: newTime,
          });
        } catch {}
      }
    });

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
    };
  // Only re-run when the song itself changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  // Keep playbackState in sync separately (cheap, no handler re-registration)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Keep iOS lock screen position/duration bar in sync
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
      } catch {
        // setPositionState can throw on older iOS — swallow it
      }
    };

    audio.addEventListener("timeupdate", updatePosition);
    audio.addEventListener("loadedmetadata", updatePosition);
    return () => {
      audio.removeEventListener("timeupdate", updatePosition);
      audio.removeEventListener("loadedmetadata", updatePosition);
    };
  }, [audioRef, song]);
};

export default useMediaSession;