import { useEffect } from "react";
import { Song } from "@/types";
import usePlayer from "./usePlayer";

const useMediaSession = (
  isPlaying: boolean,
  song: Song,
  play: () => void,
  pause: () => void
) => {
  const player = usePlayer();

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const artwork = song.image_path
      ? [
          { src: song.image_path, sizes: "96x96", type: "image/jpeg" },
          { src: song.image_path, sizes: "128x128", type: "image/jpeg" },
          { src: song.image_path, sizes: "192x192", type: "image/jpeg" },
          { src: song.image_path, sizes: "256x256", type: "image/jpeg" },
          { src: song.image_path, sizes: "512x512", type: "image/jpeg" }
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.author,
      album: "Your App Name",
      artwork,
    });

    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const audio = document.querySelector("audio") as HTMLAudioElement | null;

      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0; // Restart current track
      } else {
        player.playPrevious(); // Fallback to previous in queue or repeat
      }
    });
    navigator.mediaSession.setActionHandler("nexttrack", player.playNext);

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [isPlaying, song, play, pause, player]);
};

export default useMediaSession;
