import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function authedFetch(url: string, options: RequestInit = {}) {
  // Always get fresh session, refresh if needed
  const { data: { session } } = await supabase.auth.getSession();
  
  let token = session?.access_token;
  
  // If token expires in less than 60 seconds, refresh it
  if (session?.expires_at && session.expires_at - Date.now() / 1000 < 60) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    token = refreshed.session?.access_token ?? token;
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
