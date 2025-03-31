import React from "react";

interface MusicSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

const MusicSlider: React.FC<MusicSliderProps> = ({ value, max, onChange }) => {
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="w-full flex flex-col items-center px-4">
      {/* Time Info */}
      <div className="flex justify-between w-full text-xs text-gray-400">
        <span>{formatTime(value)}</span>
        <span>{formatTime(max)}</span>
      </div>

      {/* Custom Slider */}
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={handleSeek}
        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
      />
    </div>
  );
};

// Format time (mm:ss)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export default MusicSlider;
