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

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const imagePath = song.image_path ? `storage/v1/object/public/imagens/${song.image_path}` : '';
    const artwork = imagePath
      ? [
          { src: `${baseUrl}/${imagePath}`, sizes: "96x96", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "128x128", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "192x192", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "256x256", type: "image/jpeg" },
          { src: `${baseUrl}/${imagePath}`, sizes: "512x512", type: "image/jpeg" }
        ]
      : [];

    // Set media metadata for playback controls
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.author,
      album: "Your App Name",
      artwork,
    });

    // Set media session action handlers
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

    // Update the playback state to match the audio playback state
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    // Optionally handle changes to the audio state directly in media session
    const audio = document.querySelector("audio") as HTMLAudioElement | null;
    if (audio) {
      audio.onplay = () => {
        if (!isPlaying) {
          play();  // Synchronize the state if audio was played externally
        }
      };
      audio.onpause = () => {
        if (isPlaying) {
          pause();  // Synchronize the state if audio was paused externally
        }
      };
    }

    // Cleanup media session metadata when component is unmounted or when the song changes
    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [isPlaying, song, play, pause, player]);

};

export default useMediaSession;




