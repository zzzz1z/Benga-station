'use client';

import { Song } from "@/types";
import MediaItem from "./MediaItem";
import LikedButton from "./LikedButton";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import useSound from "use-sound";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import Slider from "./Slider";
import usePlayer from "@/hooks/usePlayer";
import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface PlayerContentProps {
  song: Song;
  songUrl: string;
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const supabaseClient = useSupabaseClient();
  const player = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song>(song);
  const [currentSongUrl, setCurrentSongUrl] = useState<string>(songUrl);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const fetchRandomSong = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("Songs")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Failed to fetch songs:", error);
        return null;
      }

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex];
      }
    } catch (error) {
      console.error("Error fetching random song:", error);
      return null;
    }
  };

  const onPlayNext = async () => {
    const randomSong = await fetchRandomSong();

    if (randomSong) {
      setCurrentSong(randomSong);
      setCurrentSongUrl(randomSong.song_path); // Assuming `song_path` contains the URL
      player.setId(randomSong.id); // Update the player state
    }
  };

  const [play, { pause, sound }] = useSound(currentSongUrl, {
    volume: volume,
    onplay: () => setIsPlaying(true),
    onended: () => {
      setIsPlaying(false);
      onPlayNext(); // Play a random song from the database when the current one ends
    },
    onpause: () => setIsPlaying(false),
    format: ["mp3"],
  });

  useEffect(() => {
    sound?.play();

    return () => {
      sound?.unload();
    };
  }, [sound]);

  const handlePlay = () => {
    if (!isPlaying) {
      play();
    } else {
      pause();
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(1);
    } else {
      setVolume(0);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full">
      <div className="flex w-full justify-start">
        <div className="flex items-center gap-x-4">
          <MediaItem data={currentSong} />
          <LikedButton songId={currentSong.id} />
        </div>
      </div>

      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <AiFillStepBackward
          onClick={() => console.log("Play previous song logic")}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <div
          onClick={handlePlay}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white p-1 cursor-pointer"
        >
          <Icon size={30} className="text-red-500" />
        </div>
        <AiFillStepForward
          onClick={onPlayNext}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>

      <div className="hidden h-full md:flex justify-center items-center w-full max-w-[722px] gap-x-6">
        <AiFillStepBackward
          onClick={() => console.log("Play previous song logic")}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <div
          onClick={handlePlay}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
        >
          <Icon size={30} className="text-red-500" />
        </div>
        <AiFillStepForward
          onClick={onPlayNext}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>

      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <VolumeIcon
            onClick={toggleMute}
            className="cursor-pointer"
            size={34}
          />
          <Slider value={volume} onChange={(value) => setVolume(value)} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;
