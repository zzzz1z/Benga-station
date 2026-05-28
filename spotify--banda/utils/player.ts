export function preextractWindow(activeID: string, ids: string[]) {
  const idx = ids.indexOf(activeID);
  if (idx === -1) return;
  const ytWindow = [
    ...ids.slice(Math.max(0, idx - 3), idx),
    ...ids.slice(idx + 1, idx + 6),
  ].filter(id => id.startsWith('yt_')).map(id => id.slice(3));
  if (!ytWindow.length) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preextract-queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds: ytWindow }),
  }).catch(() => {});
}

export async function fetchHeaderDuration(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const cd = res.headers.get('Content-Duration') || res.headers.get('X-Content-Duration');
    if (cd) {
      const parsed = parseFloat(cd);
      if (parsed && !isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return null;
}