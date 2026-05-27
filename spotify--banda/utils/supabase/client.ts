import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Only singleton on the client side
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    // Server: always a fresh instance, never cached
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  if (browserClient) return browserClient;

  browserClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return browserClient;
};