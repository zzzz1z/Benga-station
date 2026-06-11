import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem('sb-vvxyiqktniwlkzgpejzz-auth-token');
    if (!raw) return null;
    const cleaned = raw.startsWith('base64-') ? atob(raw.replace('base64-', '')) : raw;
    const parsed = JSON.parse(cleaned);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function authedFetch(url: string, options: RequestInit = {}) {
  // Try reading token directly from localStorage first — bypasses Supabase client state
  let token = getTokenFromStorage();

  // Fallback to Supabase client if direct read fails
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;
  }

  // If token expires within 5 minutes, refresh it
  if (!token) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    token = refreshed.session?.access_token ?? null;
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}