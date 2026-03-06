import { useEffect, useRef } from "react";
import { Song } from "@/types";
import usePlayer from "./usePlayer";

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
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

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

    // Use fakePlay/fakePause from PlayerContent — these mute/unmute instead of
    // actually pausing, so iOS never sees the audio stop and keeps the session alive
    navigator.mediaSession.setActionHandler("play", () => onPlayRef.current());
    navigator.mediaSession.setActionHandler("pause", () => onPauseRef.current());

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
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

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      const audio = audioRef.current;
      if (audio && details.seekTime !== undefined) {
        audio.currentTime = details.seekTime;
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: details.seekTime,
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  // Keep playbackState in sync
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
      } catch {}
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