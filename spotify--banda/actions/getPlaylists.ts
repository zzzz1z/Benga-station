import { Playlist } from "@/types";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCache, setCache, keys, TTL } from "@/libs/cache";

const getPlaylists = async (search?: string): Promise<Playlist[]> => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {}
                },
            },
        }
    );

    const resolvedUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!resolvedUserId) return [];

    // Only cache non-search requests — search is rare and low traffic
    if (!search) {
        const cacheKey = keys.playlists(resolvedUserId);
        const cached = await getCache<Playlist[]>(cacheKey);
        if (cached) return cached;
    }

    let query = supabase
        .from('Playlists')
        .select('*, playlist_songs(Songs(*))')
        .eq('user_id', resolvedUserId);

    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.log(error);
        return [];
    }

    const result = (data ?? []).map((playlist: any) => ({
        ...playlist,
        songs: (playlist.playlist_songs ?? [])
            .map((ps: any) => ps.Songs)
            .filter(Boolean),
    }));

    if (!search) {
        await setCache(keys.playlists(resolvedUserId), result, TTL.playlists);
    }

    return result;
};

export default getPlaylists;