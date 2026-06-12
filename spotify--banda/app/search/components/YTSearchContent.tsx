'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import usePlayer from '@/hooks/usePlayer';
import useAuthModal from '@/hooks/useAuthModal';
import { useUser } from '@/hooks/useUser';
import YTSearchItem, { YTResult } from '@/app/search/components/YTSearchItem';

const EXTRACT_RETRY_TIMEOUT_MS = 45000;

const preExtract = async (videoId: string, signal?: AbortSignal): Promise<boolean> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoIds: [videoId] }),
            signal,
        });
        return res.ok;
    } catch {
        return false;
    }
};

const LOADING_PHRASES = [
    'SCANNING_FREQUENCIES...',
    'INITIALIZING_BEATS...',
    'BYPASSING_PAYWALLS...',
    'SYNCING_BUFFER...',
    'ESTABLISHING_UPLINK...',
    'OPTIMIZING_STREAM...',
    'DECRYPTING_AUDIO...',
];

const BATCH_SIZE = 5;
const TARGET =15;

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
    const [isFetchingMore, setIsFetchingMore] = useState(false);





    const abortRef = useRef<AbortController | null>(null);
    const extractAbortRef = useRef<AbortController | null>(null);
    const phraseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const phraseIndexRef = useRef(0);
    const availableIdsRef = useRef<Set<string>>(new Set());
    const isFetchingMoreRef = useRef(false);
    const nextPageTokenRef = useRef<string | null>(null);
    const currentQueryRef = useRef<string>('');
    const searchPageRef = useRef(2);


    
    const resultsRef = useRef<YTResult[]>([]);
    useEffect(() => { resultsRef.current = results; }, [results]);

    const failedIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => { failedIdsRef.current = failedIds; }, [failedIds]);

    const isHandlingPlayRef = useRef(false);

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

    const fetchMoreAndAppend = useCallback(async () => {
        if (isFetchingMoreRef.current) return;
        if (!currentQueryRef.current) return;
        if (isHandlingPlayRef.current) return;
        isFetchingMoreRef.current = true;
        setIsFetchingMore(true);  // ← add


        try {
const res = await fetch(
   `${process.env.NEXT_PUBLIC_API_URL}/api/youtube/search?q=${encodeURIComponent(currentQueryRef.current)}&page=${searchPageRef.current}`,
    { 
        signal: abortRef.current!.signal,
        cache: 'no-store',
    }
);
            const data = await res.json();
            if (data.error || !data.results?.length) return;

            const newResults: YTResult[] = data.results
                .slice(0, 15)
                .filter((r: YTResult) => !availableIdsRef.current.has(r.videoId));

            if (!newResults.length) return;

            const extractResults = await Promise.all(
                newResults.map(async r => {
                    const ok = await preExtract(r.videoId);
                    return { r, ok };
                })
            );

            const available = extractResults.filter(x => x.ok).map(x => x.r);
            if (!available.length) return;

            available.forEach(r => availableIdsRef.current.add(r.videoId));
            setReadyIds(prev => new Set([...prev, ...available.map(r => r.videoId)]));
            setResults(prev => [...prev, ...available]);

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

            usePlayer.getState().appendToQueue(newSongs as any);
            searchPageRef.current += 1;
        
        } catch (err) {
            console.error('fetchMoreAndAppend error:', err);
        } finally {
            isFetchingMoreRef.current = false;
            setIsFetchingMore(false);  // ← add
        }
    }, []);


    useEffect(() => {
  const handler = () => fetchMoreAndAppend();
  window.addEventListener('yt-queue-needs-more', handler);
  return () => window.removeEventListener('yt-queue-needs-more', handler);
}, [fetchMoreAndAppend]);

    useEffect(() => {
        if (!activeID || !playerIds.length) return;
        if (isFetchingMoreRef.current) return;

        const { queueContext } = usePlayer.getState();
        if (queueContext.source !== 'search') return;

        const currentIndex = playerIds.findIndex(id => id === activeID);
        if (currentIndex === -1) return;
        const songsLeft = playerIds.length - 1 - currentIndex;
        if (songsLeft <= 2) fetchMoreAndAppend();
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
            isFetchingMoreRef.current = false;
            searchPageRef.current = 2;

            stopPhraseCycle();
            return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        extractAbortRef.current = new AbortController();

        setResults([]);
        setReadyIds(new Set());
        setLoadingIds(new Set());
        setUnavailableIds(new Set());
        setAllReady(false);
        availableIdsRef.current = new Set();
        nextPageTokenRef.current = null;
        currentQueryRef.current = query;
        isFetchingMoreRef.current = false;
        searchPageRef.current = 2;
        stopPhraseCycle();

        const doSearch = async () => {
            setIsSearching(true);
            setError(null);

            try {
                // Fetch a pool of candidates from YT search
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/youtube/search?q=${encodeURIComponent(query)}`,
                    { signal: abortRef.current!.signal }
                );
                const data = await res.json();
                if (data.error) throw new Error('search error');

                const seenIds = new Set<string>();
                const pool: YTResult[] = (data.results || [])
                    .slice(0, 15)
                    .filter((r: YTResult) => {
                        if (seenIds.has(r.videoId)) return false;
                        seenIds.add(r.videoId);
                        return true;
                    });

                // Show all candidates immediately so user sees titles/spinners right away
                setResults(pool);
                setLoadingIds(new Set(pool.map(r => r.videoId)));
                setIsSearching(false);
                startPhraseCycle();

                // Process in batches of BATCH_SIZE, stop at TARGET valid ones
                let validCount = 0;

                for (let i = 0; i < pool.length && validCount < TARGET; i += BATCH_SIZE) {
                    if (extractAbortRef.current?.signal.aborted) break;

                    const batch = pool.slice(i, i + BATCH_SIZE);

                    // Fire all BATCH_SIZE preextracts in parallel
                    const batchResults = await Promise.all(
                        batch.map(async r => {
                            const ok = await preExtract(r.videoId, extractAbortRef.current?.signal);
                            return { r, ok };
                        })
                    );

                    if (extractAbortRef.current?.signal.aborted) break;

                    const available = batchResults.filter(x => x.ok).map(x => x.r);
                    const unavailable = batchResults.filter(x => !x.ok).map(x => x.r);

                    // Mark available
                    available.forEach(r => availableIdsRef.current.add(r.videoId));
                    if (available.length) {
                        setReadyIds(prev => new Set([...prev, ...available.map(r => r.videoId)]));
                        validCount += available.length;
                    }

                    // Remove unavailable from results list
                    if (unavailable.length) {
                        const unavailableSet = new Set(unavailable.map(r => r.videoId));
                        setUnavailableIds(prev => new Set([...prev, ...unavailableSet]));
                        setResults(prev => prev.filter(r => !unavailableSet.has(r.videoId)));
                    }

                    // Clear spinners for this batch
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        batch.forEach(r => next.delete(r.videoId));
                        return next;
                    });
                }

                stopPhraseCycle();
                setAllReady(true);
                currentQueryRef.current = query;

            } catch (err: any) {
                if (err.name !== 'AbortError') setError('SYSTEM_OFFLINE_RETRY_LATER');
                stopPhraseCycle();
                setIsSearching(false);
            } finally {
                setIsSearching(false);
            }
        };

        doSearch();

        return () => {
            abortRef.current?.abort();
            extractAbortRef.current?.abort();
            stopPhraseCycle();
        };
    }, [query]);

    useEffect(() => {
        return () => { stopPhraseCycle(); };
    }, []);

const handlePlay = useCallback(async (result: YTResult) => {
    if (!user) { authModal.onOpen('sign_up'); return; }
    if (isHandlingPlayRef.current) return;
    if (loadingId === result.videoId) return;
    if (unavailableIds.has(result.videoId)) return;
    if (failedIdsRef.current.has(`yt_${result.videoId}`)) return;

    isHandlingPlayRef.current = true;

    // If not ready yet, just mark unavailable — don't block waiting
    if (!availableIdsRef.current.has(result.videoId)) {
        isHandlingPlayRef.current = false;
        return;
    }

    const targetId = `yt_${result.videoId}`;
    const baseSongs = resultsRef.current
        .filter(r => availableIdsRef.current.has(r.videoId) && !failedIdsRef.current.has(`yt_${r.videoId}`))
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

    player.setQueue(baseSongs as any, targetId, { source: 'search', searchQuery: query });
    setPlayingId(result.videoId);

    setTimeout(() => { isHandlingPlayRef.current = false; }, 300);
}, [user, authModal, player, query, loadingId, unavailableIds]);
    if (!query || query.trim().length < 2) {
        return (
            <p className="text-neutral-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">
                {">"} INPUT_QUERY_REQUIRED: ENTER_ARTIST_OR_TRACK
            </p>
        );
    }

    if (isSearching) {
        return (
            <div className="flex items-center gap-x-3 px-6 py-4 text-neutral-400 font-mono text-[10px]">
                <div className="w-2 h-2 bg-red-600 animate-pulse" />
                INITIATING_GLOBAL_SEARCH...
            </div>
        );
    }

    if (error) {
        return <p className="text-red-600 px-6 py-4 text-[10px] font-black">{">"} {error}</p>;
    }

    if (results.length === 0) {
        return (
            <p className="text-neutral-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">
                {">"} ERR: NO_MATCHES_FOUND_IN_SECTOR
            </p>
        );
    }

    return (
        <div className="flex flex-col w-full">
            {bannerPhrase && !allReady && (
                <div className="mx-6 mb-6 px-4 py-2 bg-neutral-900/50 border-l-2 border-red-600 flex items-center justify-between">
                    <div className="flex items-center gap-x-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                        <p className="text-neutral-400 font-mono text-[9px] uppercase tracking-widest">{bannerPhrase}</p>
                    </div>
                    <span className="text-red-600 font-mono text-[9px] opacity-50 font-black">STABLE_CONNECTION</span>
                </div>
            )}

            <div className="flex flex-col w-full px-6 gap-y-1">
                {results.map((result) => (
                    <div key={result.videoId} className="relative border-b border-white/5 last:border-0">
                        <YTSearchItem
                            result={result}
                            onPlay={handlePlay}
                            isLoading={loadingIds.has(result.videoId) || loadingId === result.videoId}
                            isReady={readyIds.has(result.videoId)}
                            isUnavailable={unavailableIds.has(result.videoId) || failedIds.has(`yt_${result.videoId}`)}
                            isPlaying={playingId === result.videoId && player.activeID === `yt_${result.videoId}`}
                        />
                    </div>
                ))}

        
{allReady && (
    <div className="px-6 mt-4 mb-2">
<button
    onClick={fetchMoreAndAppend}
    disabled={isFetchingMore}
            className="w-full flex items-center justify-center gap-x-3 py-3 border border-red-900/40 text-red-500/60 font-mono text-[10px] uppercase tracking-[0.2em] disabled:opacity-40"
        >
            {isFetchingMore  ? (
                <>
                    <div className="w-2 h-2 bg-red-600 animate-pulse" />
                    LOADING_MORE...
                </>
            ) : (
                <>
                    <span className="text-red-900/60">{'>'}</span>
                    LOAD_MORE_RESULTS
                </>
            )}
        </button>
    </div>
)}
            </div>
        </div>
    );
};

export default YTSearchContent;