import { Song } from "@/types";
import { useEffect } from "react";
import useLoadImage from "./useLoadImage"; // make sure this hook returns a public image URL
import usePlayer from "./usePlayer";

const useMediaSession = (
  isPlaying: boolean,
  song: Song,
  play: () => void,
  pause: () => void
) => {
  const player = usePlayer();
  const imageUrl = useLoadImage(song); // 🔥 returns actual image URL from storage

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const artwork = imageUrl
      ? [
          {
            src: imageUrl,
            sizes: '512x512',
            type: 'image/jpeg',
          },
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
    navigator.mediaSession.setActionHandler("previoustrack", player.playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", player.playNext);
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [isPlaying, song, imageUrl, play, pause, player]);
};


export default useMediaSession;