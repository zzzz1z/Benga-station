import { useEffect, useRef } from 'react';
import usePlayer from './usePlayer';

interface QueueExtenderOptions {
  query?: string;       // current search filter if any (empty = home feed)
  enabled?: boolean;
}

export function useQueueExtender({ query = '', enabled = true }: QueueExtenderOptions = {}) {
  const { ids, activeID, songs, appendToQueue } = usePlayer();
  const pageRef = useRef(2); // we already loaded page 1
  const isFetchingRef = useRef(false);
  const exhaustedRef = useRef(false);

  // Reset when the queue source changes (new search or new play session)
  useEffect(() => {
    pageRef.current = 2;
    isFetchingRef.current = false;
    exhaustedRef.current = false;
  }, [query]);

  useEffect(() => {
    if (!enabled || !activeID || exhaustedRef.current || isFetchingRef.current) return;

    const currentIndex = ids.indexOf(activeID);
    if (currentIndex === -1) return;

    const remaining = ids.length - currentIndex - 1;
    if (remaining > 4) return; // still plenty left

    // Fetch next page
    isFetchingRef.current = true;

    const params = new URLSearchParams({
      page: String(pageRef.current),
      ...(query.trim().length >= 2 ? { title: query } : {}),
    });

    fetch(`/api/songs?${params.toString()}`)
      .then(r => r.json())
      .then(({ songs: newSongs, hasMore }) => {
        if (!newSongs || newSongs.length === 0) {
          exhaustedRef.current = true;
          return;
        }
        // appendToQueue expects song ids — add songs to player store then append ids
        appendToQueue(newSongs);
        pageRef.current += 1;
        if (!hasMore) exhaustedRef.current = true;
      })
      .catch(() => {
        // silently fail — no need to surface this to user
      })
      .finally(() => {
        isFetchingRef.current = false;
      });
  }, [activeID, ids, enabled, query, appendToQueue]);
}