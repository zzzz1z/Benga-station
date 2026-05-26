// warmCache.ts — replaced with preextract-queue, no more one-by-one delays
export function scheduleWarm(videoIds: string[]) {
  if (!videoIds.length) return;
  const valid = videoIds.filter(id => /^[a-zA-Z0-9_-]{11}$/.test(id));
  if (!valid.length) return;

fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds: valid }),
  }).catch(() => {});
}