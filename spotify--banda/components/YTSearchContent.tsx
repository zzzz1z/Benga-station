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
    'SCANNING_FREQUENCIES...',
    'INITIALIZING_BEATS...',
    'BYPASSING_PAYWALLS...',
    'SYNCING_BUFFER...',
    'ESTABLISHING_UPLINK...',
    'OPTIMIZING_STREAM...',
    'DECRYPTING_AUDIO...',
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
    const scheduledIdsRef = useRef<Set<string>>(new Set());
    const isFetchingMoreRef = useRef(false);
    const nextPageTokenRef = useRef<string | null>(null);
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
        if (scheduledIdsRef.current.has(videoId)) return;
        scheduledIdsRef.current.add(videoId);

        const t = setTimeout(async () => {
            if (!availableIdsRef.current.has(videoId)) {
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
    }, [markUnavailable]);

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

            const extractResults = await Promise.all(
                newResults.map(async r => {
                    const ok = await preExtract(r.videoId);
                    return { r, ok };
                })
            );

            const available = extractResults.filter(x => x.ok).map(x => x.r);
            if (!available.length) return;

            available.forEach(r => {
                availableIdsRef.current.add(r.videoId);
            });
            setReadyIds(prev => new Set([...prev, ...available.map(r => r.videoId)]));
            setResults(prev => [...prev, ...newResults]);

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

        } catch (err) {
            console.error('fetchMoreAndAppend error:', err);
        } finally {
            isFetchingMoreRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!activeID || !playerIds.length) return;
        if (isFetchingMoreRef.current) return;
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
            scheduledIdsRef.current = new Set();
            nextPageTokenRef.current = null;
            currentQueryRef.current = '';
            isFetchingMoreRef.current = false;
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
        scheduledIdsRef.current = new Set();
        nextPageTokenRef.current = null;
        currentQueryRef.current = query;
        isFetchingMoreRef.current = false;
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
                    setError('ERROR: GLOBAL_UPLINK_FAILURE');
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
                if (err.name !== 'AbortError') setError('SYSTEM_OFFLINE_RETRY_LATER');
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
    }, [query, scheduleStuckCheck]);

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

        const targetId = `yt_${result.videoId}`;

        const baseSongs = results
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

        player.setQueue(baseSongs as any, targetId);
        setPlayingId(result.videoId);
    };

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
            </div>
        </div>
    );
};

export default YTSearchContent;