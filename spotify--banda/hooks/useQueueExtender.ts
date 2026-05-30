import { useEffect, useRef } from 'react';
import usePlayer from './usePlayer';

interface QueueExtenderOptions {
  enabled?: boolean;
}

export function useQueueExtender({ enabled = true }: QueueExtenderOptions = {}) {
  const ids = usePlayer(s => s.ids);
  const activeID = usePlayer(s => s.activeID);
  const appendToQueueRef = useRef(usePlayer.getState().appendToQueue);

  useEffect(() => {
    appendToQueueRef.current = usePlayer.getState().appendToQueue;
  });

  const pageRef = useRef(2);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !activeID) return;

    const currentIndex = ids.indexOf(activeID);
    if (currentIndex === -1) return;

    const remaining = ids.length - currentIndex - 1;
    if (remaining > 4) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs?page=${pageRef.current}`)
      .then(r => r.json())
      .then(({ songs: newSongs, hasMore }) => {
        if (!newSongs || newSongs.length === 0 || !hasMore) {
          // DB exhausted — reset to page 1 and loop
          pageRef.current = 1;
        } else {
          appendToQueueRef.current(newSongs);
          pageRef.current += 1;
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetchingRef.current = false;
      });
  }, [activeID, ids, enabled]);
}