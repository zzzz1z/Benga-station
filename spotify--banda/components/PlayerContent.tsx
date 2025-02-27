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
import ShuffleSongs from "@/app/playlists/components/ShuffleSongs";

interface PlayerContentProps {
  song: Song;
  songUrl: string;
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  // Define se a próxima música será aleatória ou em sequência
  const handlePlayNextSong = () => {
    player.playNext();
  };

  // Hook de uso de som, controla a reprodução e o volume
  const [play, { pause, sound }] = useSound(songUrl, {
    volume: volume,
    onplay: () => setIsPlaying(true),
    onpause: () => setIsPlaying(false),
    onend: handlePlayNextSong,
    format: ["mp3"],
  });

  useEffect(() => {
    sound?.play();
    return () => {
      sound?.unload();
    };
  }, [sound]);

  // Alterna entre reproduzir e pausar a música
  const handlePlay = () => {
    isPlaying ? pause() : play();
  };

  // Alterna entre ativar e desativar o volume
  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
      {/* Informações da música */}
      <div className="flex  items-center justify-center m-auto w-full">
        <MediaItem data={song} />
        <LikedButton songId={song.id} />
      </div>

      

      {/* Controles para desktop */}
      <div className="hidden md:flex justify-center items-center w-full max-w-[700px] gap-2">
        <AiFillStepBackward
          onClick={player.playPrevious}
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
          onClick={handlePlayNextSong}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>
      
      
      {/* Controles para dispositivos móveis */}
      <div className="flex md:hidden col-auto w-80 justify-center items-center gap-2">
        <AiFillStepBackward
          onClick={player.playPrevious}
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
          onClick={handlePlayNextSong}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>

      {/* Controles de volume */}
      <div className="hidden md:flex w-full justify-end pr-4 min-w-0">
        <div className="flex items-center gap-2 w-[120px]">
          <VolumeIcon
            onClick={toggleMute}
            className="cursor-pointer"
            size={34}
          />
          <Slider value={volume} onChange={setVolume} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;