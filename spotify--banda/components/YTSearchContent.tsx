'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import usePlayer from '@/hooks/usePlayer';
import useAuthModal from '@/hooks/useAuthModal';
import { useUser } from '@/hooks/useUser';
import YTSearchItem, { YTResult } from '@/components/YTSearchItem';

const EXTRACT_TIMEOUT_MS = 30000;
const EXTRACT_RETRY_TIMEOUT_MS = 45000;

const preExtract = async (videoId: string, signal?: AbortSignal): Promise<boolean> => {
  try {
    const res = await fetch('/api/preextract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
      signal,
    });
    return res.ok;
  } catch {
    return false;
  }
};

const LOADING_PHRASES = [
  'Acordando o servidor... ',
  'Procurando pelas músicas... ',
  'Quase lá... ',
  'Sim é grátis, mas considera doar ',
  'A carregar os beats... ',
  'Só mais um segundo... ',
  'Vale a pena esperar ',
];

interface YTSearchContentProps {
  query: string;
}

const YTSearchContent: React.FC<YTSearchContentProps> = ({ query }) => {
  const player = usePlayer();
  const activeID = usePlayer(state => state.activeID);
  const playerIds = usePlayer(state => state.ids);
  const failedIds = usePlayer(state => state.failedIds);
  const authModal = useAuthModal();
  const { user } = useUser();

  const [results, setResults] = useState<YTResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [bannerPhrase, setBannerPhrase] = useState<string | null>(null);
  const [allReady, setAllReady] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const extractAbortRef = useRef<AbortController | null>(null);
  const phraseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phraseIndexRef = useRef(0);
  const availableIdsRef = useRef<Set<string>>(new Set());
  const stuckTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // for infinite queue
  const nextPageTokenRef = useRef<string | null>(null);
  const isFetchingMoreRef = useRef(false);
  const currentQueryRef = useRef<string>('');

  const startPhraseCycle = () => {
    phraseIndexRef.current = 0;
    setBannerPhrase(LOADING_PHRASES[0]);
    phraseTimerRef.current = setInterval(() => {
      phraseIndexRef.current = (phraseIndexRef.current + 1) % LOADING_PHRASES.length;
      setBannerPhrase(LOADING_PHRASES[phraseIndexRef.current]);
    }, 2000);
  };

  const stopPhraseCycle = () => {
    if (phraseTimerRef.current) {
      clearInterval(phraseTimerRef.current);
      phraseTimerRef.current = null;
    }
    setBannerPhrase(null);
  };

  const clearStuckTimers = () => {
    stuckTimersRef.current.forEach(t => clearTimeout(t));
    stuckTimersRef.current.clear();
  };

  useEffect(() => {
    return () => {
      stopPhraseCycle();
      clearStuckTimers();
    };
  }, []);

  const markUnavailable = useCallback((videoId: string) => {
    setUnavailableIds(prev => new Set([...prev, videoId]));
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(videoId);
      return next;
    });
    stuckTimersRef.current.delete(videoId);
  }, []);

  const scheduleStuckCheck = useCallback((videoId: string, completedCountRef: { value: number }, total: number) => {
    const t = setTimeout(async () => {
      if (!readyIds.has(videoId) && !unavailableIds.has(videoId)) {
        const retryAbort = new AbortController();
        const retryTimeout = setTimeout(() => retryAbort.abort(), EXTRACT_RETRY_TIMEOUT_MS);
        const success = await preExtract(videoId, retryAbort.signal);
        clearTimeout(retryTimeout);

        if (success) {
          availableIdsRef.current.add(videoId);
          setReadyIds(prev => new Set([...prev, videoId]));
          setLoadingIds(prev => {
            const next = new Set(prev);
            next.delete(videoId);
            return next;
          });
        } else {
          markUnavailable(videoId);
        }

        completedCountRef.value++;
        if (completedCountRef.value === total) {
          stopPhraseCycle();
          setAllReady(true);
        }
      }
      stuckTimersRef.current.delete(videoId);
    }, EXTRACT_TIMEOUT_MS);

    stuckTimersRef.current.set(videoId, t);
  }, [markUnavailable, readyIds, unavailableIds]);

  // Fetch more results and append to the player queue
  const fetchMoreAndAppend = useCallback(async () => {
    if (isFetchingMoreRef.current) return;
    if (!nextPageTokenRef.current) return;
    if (!currentQueryRef.current) return;

    isFetchingMoreRef.current = true;

    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(currentQueryRef.current)}&pageToken=${nextPageTokenRef.current}`
      );
      const data = await res.json();
      if (data.error || !data.results?.length) return;

      nextPageTokenRef.current = data.nextPageToken ?? null;

      const newResults: YTResult[] = data.results.slice(0, 8);

      // pre-extract all new results in parallel
      const extractResults = await Promise.all(
        newResults.map(async r => {
          const ok = await preExtract(r.videoId);
          return { r, ok };
        })
      );

      const available = extractResults.filter(x => x.ok).map(x => x.r);
      if (!available.length) return;

      // update availableIdsRef and readyIds
      available.forEach(r => {
        availableIdsRef.current.add(r.videoId);
      });
      setReadyIds(prev => new Set([...prev, ...available.map(r => r.videoId)]));
      setResults(prev => [...prev, ...newResults]);

      // append to the player store
      const newSongs = available.map(r => ({
        id: `yt_${r.videoId}`,
        user_id: 'youtube',
        author: r.artist,
        title: r.title,
        song_path: r.videoId,
        image_path: r.thumbnail,
        source: 'youtube' as const,
        youtube_video_id: r.videoId,
      }));

      const { ids, songs, activeID: currentActive } = usePlayer.getState();
      const updatedSongs = { ...songs };
      newSongs.forEach(s => { updatedSongs[s.id] = s as any; });
      const updatedIds = [...ids, ...newSongs.map(s => s.id)];

      usePlayer.setState({ ids: updatedIds, songs: updatedSongs });

    } catch (err) {
      console.error('fetchMoreAndAppend error:', err);
    } finally {
      isFetchingMoreRef.current = false;
    }
  }, []);

  // Watch queue position — when 2 songs from end, fetch more
  useEffect(() => {
    if (!activeID || !playerIds.length) return;
    const currentIndex = playerIds.findIndex(id => id === activeID);
    if (currentIndex === -1) return;
    const songsLeft = playerIds.length - 1 - currentIndex;
    if (songsLeft <= 2) {
      fetchMoreAndAppend();
    }
  }, [activeID, playerIds, fetchMoreAndAppend]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setReadyIds(new Set());
      setLoadingIds(new Set());
      setUnavailableIds(new Set());
      setAllReady(false);
      availableIdsRef.current = new Set();
      nextPageTokenRef.current = null;
      currentQueryRef.current = '';
      stopPhraseCycle();
      clearStuckTimers();
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    extractAbortRef.current = new AbortController();

    setReadyIds(new Set());
    setLoadingIds(new Set());
    setUnavailableIds(new Set());
    setAllReady(false);
    availableIdsRef.current = new Set();
    nextPageTokenRef.current = null;
    currentQueryRef.current = query;
    stopPhraseCycle();
    clearStuckTimers();

    const doSearch = async () => {
      setIsSearching(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current!.signal }
        );
        const data = await res.json();

        if (data.error) {
          setError('Erro ao pesquisar. Tenta novamente.');
          setResults([]);
          return;
        }

        nextPageTokenRef.current = data.nextPageToken ?? null;

        const fetchedResults: YTResult[] = (data.results || []).slice(0, 8);
        setResults(fetchedResults);
        setLoadingIds(new Set(fetchedResults.map(r => r.videoId)));
        startPhraseCycle();

        const total = fetchedResults.length;
        const completedCountRef = { value: 0 };

        fetchedResults.forEach(result => {
          if (extractAbortRef.current?.signal.aborted) return;

          scheduleStuckCheck(result.videoId, completedCountRef, total);

          preExtract(result.videoId, extractAbortRef.current?.signal)
            .then(success => {
              const t = stuckTimersRef.current.get(result.videoId);
              if (t) {
                clearTimeout(t);
                stuckTimersRef.current.delete(result.videoId);
              }

              if (success) {
                availableIdsRef.current.add(result.videoId);
                setReadyIds(prev => new Set([...prev, result.videoId]));
              } else {
                setUnavailableIds(prev => new Set([...prev, result.videoId]));
              }
              setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(result.videoId);
                return next;
              });
            })
            .finally(() => {
              completedCountRef.value++;
              if (completedCountRef.value === total) {
                stopPhraseCycle();
                setAllReady(true);
              }
            });
        });

      } catch (err: any) {
        if (err.name !== 'AbortError') setError('Erro de ligação.');
        stopPhraseCycle();
        clearStuckTimers();
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();

    return () => {
      abortRef.current?.abort();
      extractAbortRef.current?.abort();
      stopPhraseCycle();
      clearStuckTimers();
    };
  }, [query]);

  const handlePlay = async (result: YTResult) => {
    if (!user) { authModal.onOpen('sign_up'); return; }
    if (loadingId === result.videoId) return;
    if (unavailableIds.has(result.videoId)) return;
    if (failedIds.has(`yt_${result.videoId}`)) return;

    if (!readyIds.has(result.videoId)) {
      setLoadingId(result.videoId);
      const success = await preExtract(result.videoId);
      setLoadingId(null);
      if (success) {
        availableIdsRef.current.add(result.videoId);
        setReadyIds(prev => new Set([...prev, result.videoId]));
      } else {
        setUnavailableIds(prev => new Set([...prev, result.videoId]));
        return;
      }
    }

    const allSongs = results
      .filter(r => availableIdsRef.current.has(r.videoId) && !failedIds.has(`yt_${r.videoId}`))
      .map(r => ({
        id: `yt_${r.videoId}`,
        user_id: 'youtube',
        author: r.artist,
        title: r.title,
        song_path: r.videoId,
        image_path: r.thumbnail,
        source: 'youtube' as const,
        youtube_video_id: r.videoId,
      }));

    player.setQueue(allSongs, `yt_${result.videoId}`);
    setPlayingId(result.videoId);
  };

  if (!query || query.trim().length < 2) {
    return (
      <p className="text-neutral-400 px-6 py-4 text-sm">
        Escreve o nome de uma música ou artista para pesquisar no YouTube.
      </p>
    );
  }

  if (isSearching) {
    return (
      <div className="flex items-center gap-x-2 px-6 py-4 text-neutral-400 text-sm">
        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
        A pesquisar...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 px-6 py-4 text-sm">{error}</p>;
  }

  if (results.length === 0) {
    return (
      <p className="text-neutral-400 px-6 py-4 text-sm">
        Nenhum resultado encontrado para &quot;{query}&quot;.
      </p>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {bannerPhrase && !allReady && (
        <div className="mx-6 mb-3 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center gap-x-3">
          <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-neutral-300 text-sm">{bannerPhrase}</p>
        </div>
      )}

      <div className="flex flex-col gap-y-1 w-full px-6">
        {results.map((result) => (
          <YTSearchItem
            key={result.videoId}
            result={result}
            onPlay={handlePlay}
            isLoading={loadingIds.has(result.videoId) || loadingId === result.videoId}
            isReady={readyIds.has(result.videoId)}
            isUnavailable={unavailableIds.has(result.videoId) || failedIds.has(`yt_${result.videoId}`)}
            isPlaying={playingId === result.videoId && player.activeID === `yt_${result.videoId}`}
          />
        ))}
      </div>
    </div>
  );
};

export default YTSearchContent;