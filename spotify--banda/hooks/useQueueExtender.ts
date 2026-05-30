import { useEffect, useRef } from 'react';
import usePlayer from './usePlayer';

interface QueueExtenderOptions {
  enabled?: boolean;
}

export function useQueueExtender({ enabled = true }: QueueExtenderOptions = {}) {
  const ids = usePlayer(s => s.ids);
  const activeID = usePlayer(s => s.activeID);
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

    const doFetch = (page: number) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs?page=${page}`)
        .then(r => r.json())
        .then(({ songs: newSongs, hasMore }) => {
          if (!newSongs || newSongs.length === 0 || !hasMore) {
            // DB exhausted — reset and fetch from page 1 immediately
            pageRef.current = 1;
            doFetch(1);
            return;
          }
          usePlayer.getState().appendToQueue(newSongs);
          pageRef.current = page + 1;
        })
        .catch(() => {})
        .finally(() => {
          isFetchingRef.current = false;
        });
    };

    doFetch(pageRef.current);
  }, [activeID, ids, enabled]);
}