// utils/warmCache.ts — add a helper so both callers go through one place
export const warmedVideos = new Set<string>();

export function scheduleWarm(videoIds: string[]) {
    const toWarm = videoIds.filter(id => !warmedVideos.has(id));
    toWarm.forEach(id => warmedVideos.add(id)); // mark before fetch to prevent races
    toWarm.forEach((videoId, i) => {
        setTimeout(() => {
            fetch('/api/preextract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId }),
            }).catch(() => {});
        }, i * 300);
    });
}