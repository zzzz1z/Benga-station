import React, { useEffect, useState } from "react";

interface MusicSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

const MusicSlider: React.FC<MusicSliderProps> = ({ value, max, onChange }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="w-full px-4">
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
      />
    </div>
  );
};

export default MusicSlider;