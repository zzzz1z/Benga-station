import { Song } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCache, setCache, keys, TTL } from "@/libs/cache";

const getLikedSongs = async (): Promise<Song[]> => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {}
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const cacheKey = keys.liked(user.id);
    const cached = await getCache<Song[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
        .from('Músicas_Favoritas')
        .select('*, Songs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.log(error);
        return [];
    }

    const result = (data || []).map((item) => ({ ...item.Songs }));
    await setCache(cacheKey, result, TTL.liked);

    return result;
};

export default getLikedSongs;