import { Playlist } from "@/types";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    return (data ?? []).map((playlist: any) => ({
        ...playlist,
        songs: (playlist.playlist_songs ?? [])
            .map((ps: any) => ps.Songs)
            .filter(Boolean),
    }));
};

export default getPlaylists;