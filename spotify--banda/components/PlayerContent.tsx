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
import MusicSlider from "./MusicSlider";

interface PlayerContentProps {
  song: Song;
  songUrl: string;
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);  
  // Inside PlayerContent component
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const handlePlayNextSong = () => {
    player.playNext();
  };

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

  const handlePlay = () => {
    isPlaying ? pause() : play();
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0);
  };





// Update duration when sound is loaded
useEffect(() => {
  if (sound) {
    setDuration(sound.duration() || 0);
  }
}, [sound]);

// Update current position every second
useEffect(() => {
  const interval = setInterval(() => {
    if (sound && isPlaying) {
      setPosition(sound.seek());
    }
  }, 1000);

  return () => clearInterval(interval);
}, [sound, isPlaying]);

// Handle manual seeking
const handleSeek = (value: number) => {
  setPosition(value);
  sound.seek(value);
};


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full items-center justify-between w-full">
      {/* Informações da música */}
      <div className="flex items-center justify-center m-auto w-full space-x-4">
        <MediaItem data={song} />
        <LikedButton songId={song.id} />
      </div>

      {/* Controles para desktop */}
      <div className="hidden md:flex items-center justify-center w-full mb-2 flex-col"> 
        
        


        <div className="hidden md:flex justify-center items-center w-full max-w-[700px] gap-4">
        <AiFillStepBackward
          onClick={player.playPrevious}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <div
          onClick={handlePlay}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-2 cursor-pointer"
        >
          <Icon size={30} className="text-red-500" />
        </div>
        <AiFillStepForward
          onClick={handlePlayNextSong}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        </div>

         {/* Music Progress Slider */}
        <div className="w-full px-4">
          <MusicSlider value={position} onChange={handleSeek} max={duration} />
        </div>



      </div>
     
      
      {/* Controles para dispositivos móveis */}
      <div className="flex md:hidden justify-center items-center flex-col">

        <div className=" flex items-center justify-center w-full"> 

        
          <AiFillStepBackward
          onClick={player.playPrevious}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <div
          onClick={handlePlay}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-white p-2 cursor-pointer"
          >
          <Icon size={20} className="text-red-500" />
          </div>
          <AiFillStepForward
          onClick={handlePlayNextSong}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
          />

          
        </div>

        {/* Music Progress Slider */}
          <div className="w-full px-4">
          <MusicSlider value={position} onChange={handleSeek} max={duration} />
          </div>

      </div>

      {/* Controles de volume */}
      <div className="hidden md:flex w-full justify-end pr-4 min-w-0">
        <div className="flex items-center gap-4 w-[150px]">
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


