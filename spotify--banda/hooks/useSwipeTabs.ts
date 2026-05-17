import { useEffect, useRef } from 'react';

interface SwipeTabsOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeTabs(
  containerRef: React.RefObject<HTMLElement>,
  { onSwipeLeft, onSwipeRight, threshold = 60, enabled = true }: SwipeTabsOptions
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Only trigger if horizontal movement dominates (not a scroll)
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx) * 0.8) {
        startX.current = null;
        startY.current = null;
        return;
      }

      if (dx < 0) onSwipeLeft();
      else onSwipeRight();

      startX.current = null;
      startY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, onSwipeLeft, onSwipeRight, threshold, enabled]);
}