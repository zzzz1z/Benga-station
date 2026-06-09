import React, { useEffect, useState, useRef, useCallback } from "react";

interface MusicSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

const MusicSlider: React.FC<MusicSliderProps> = ({ value, max, onChange }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (!dragging) setLocalValue(value); }, [value, dragging]);

  const getValueFromClientX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track || !max) return 0;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * max;
  }, [max]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLocalValue(getValueFromClientX(e.clientX));
    const onMove = (ev: MouseEvent) => setLocalValue(getValueFromClientX(ev.clientX));
    const onUp = (ev: MouseEvent) => {
      const final = getValueFromClientX(ev.clientX);
      setLocalValue(final);
      onChange(final);
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    setLocalValue(getValueFromClientX(e.touches[0].clientX));
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      setLocalValue(getValueFromClientX(ev.touches[0].clientX));
    };
    const onEnd = (ev: TouchEvent) => {
      const final = getValueFromClientX(ev.changedTouches[0].clientX);
      setLocalValue(final);
      onChange(final);
      setDragging(false);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  if (!isMounted) return null;

  const pct = max > 0 ? (localValue / max) * 100 : 0;

  return (
    <div className="w-full px-4 py-3" style={{ touchAction: 'none' }}>
      <div
        ref={trackRef}
        className="relative w-full h-1 bg-neutral-700 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute left-0 top-0 h-full bg-red-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-md"
          style={{ left: `${pct}%`, top: '50%', transform: 'translateX(-50%) translateY(-50%)', touchAction: 'none' }}
        />
      </div>
    </div>
  );
};

export default MusicSlider;