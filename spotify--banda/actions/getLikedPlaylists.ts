import { Playlist } from "@/types";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const getLikedPlaylists = async (): Promise<Playlist[]> => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('Playlists_Favoritas')
        .select('*, Playlists(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item) => ({ ...item.Playlists }));
};

export default getLikedPlaylists;