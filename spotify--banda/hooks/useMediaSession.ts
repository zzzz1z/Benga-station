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
  const isPlayingRef = useRef(isPlaying);

  // Keep ref in sync so visibility/pageshow handlers see latest value
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!song || !audioRef.current) return;

    const audio = audioRef.current;

    if (!("mediaSession" in navigator)) return;

    // Build artwork array — fall back gracefully if no image
    const artwork: MediaImage[] = song.image_path
      ? [{ src: song.image_path, sizes: "512x512", type: "image/jpeg" }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.author,
      artwork,
    });

    const updatePosition = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch {
        // Safari sometimes throws if called too early
      }
    };

    // Extracted so we can re-assert after iOS interruptions
    const reassertHandlers = () => {
      navigator.mediaSession.setActionHandler("play", () => {
        onPlay();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        onPause();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        player.playNext();
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        player.playPrevious();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;