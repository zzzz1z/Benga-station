import { useEffect, useRef, useState, useCallback } from 'react';
import usePlayer from './usePlayer';

interface QueueExtenderOptions {
  query?: string;
  enabled?: boolean;
  onNeedsMoreYT?: () => void; // callback when in search context and queue is low
}

export type QueueExtenderStatus = 'idle' | 'fetching' | 'done' | 'exhausted';

export function useQueueExtender({ query = '', enabled = true, onNeedsMoreYT }: QueueExtenderOptions = {}) {
  const { ids, activeID, appendToQueue } = usePlayer();
  const pageRef        = useRef(2);
  const isFetchingRef  = useRef(false);
  const exhaustedRef   = useRef(false);
  const [status, setStatus] = useState<QueueExtenderStatus>('idle');
  const onNeedsMoreYTRef = useRef(onNeedsMoreYT);
  useEffect(() => { onNeedsMoreYTRef.current = onNeedsMoreYT; }, [onNeedsMoreYT]);

  useEffect(() => {
    pageRef.current       = 2;
    isFetchingRef.current = false;
    exhaustedRef.current  = false;
    setStatus('idle');
  }, [query]);

  useEffect(() => {
    if (!enabled || !activeID || exhaustedRef.current || isFetchingRef.current) return;

    const { queueContext } = usePlayer.getState();
    const currentIndex = ids.indexOf(activeID);
    if (currentIndex === -1) return;

    const remaining = ids.length - currentIndex - 1;
    if (remaining > 4) return;

    // In search context, delegate to YTSearchContent via callback
    if (queueContext.source === 'search') {
      onNeedsMoreYTRef.current?.();
      return;
    }

    isFetchingRef.current = true;
    setStatus('fetching');

    const params = new URLSearchParams({
      page: String(pageRef.current),
      ...(query.trim().length >= 2 ? { title: query } : {}),
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs?${params.toString()}`)
      .then(r => r.json())
      .then(({ songs: newSongs, hasMore }) => {
        if (!newSongs || newSongs.length === 0) {
          exhaustedRef.current = true;
          setStatus('exhausted');
          return;
        }
        appendToQueue(newSongs);
        pageRef.current += 1;
        if (!hasMore) {
          exhaustedRef.current = true;
          setStatus('exhausted');
        } else {
          setStatus('done');
          setTimeout(() => setStatus('idle'), 3000);
        }
      })
      .catch(() => setStatus('idle'))
      .finally(() => { isFetchingRef.current = false; });
  }, [activeID, ids, enabled, query, appendToQueue]);

  const fetchMore = useCallback(() => {
    if (isFetchingRef.current || !enabled) return;

    const { queueContext } = usePlayer.getState();
    if (queueContext.source === 'search') {
      onNeedsMoreYTRef.current?.();
      return;
    }

    exhaustedRef.current  = false;
    isFetchingRef.current = true;
    setStatus('fetching');

    const params = new URLSearchParams({
      page: String(pageRef.current),
      ...(query.trim().length >= 2 ? { title: query } : {}),
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs?${params.toString()}`)
      .then(r => r.json())
      .then(({ songs: newSongs, hasMore }) => {
        if (!newSongs || newSongs.length === 0) {
          exhaustedRef.current = true;
          setStatus('exhausted');
          return;
        }
        appendToQueue(newSongs);
        pageRef.current += 1;
        if (!hasMore) {
          exhaustedRef.current = true;
          setStatus('exhausted');
        } else {
          setStatus('done');
          setTimeout(() => setStatus('idle'), 3000);
        }
      })
      .catch(() => setStatus('idle'))
      .finally(() => { isFetchingRef.current = false; });
  }, [enabled, query, appendToQueue]);

  return { status, fetchMore };
}