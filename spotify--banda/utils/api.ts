import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function authedFetch(url: string, options: RequestInit = {}) {
  // Try to get token from Supabase client
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    const newToken = data.session?.access_token ?? null;
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      },
    });
  }

  return res;
}