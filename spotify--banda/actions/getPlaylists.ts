import { Playlist } from "@/types";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getPlaylists = async (search?: string, userId?: string): Promise<Playlist[]> => {
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

    // If no userId passed, read from session
    
    const resolvedUserId = (await supabase.auth.getUser()).data.user?.id;

    let query = supabase
        .from('Playlists')
        .select('*');

        

    if (resolvedUserId) {
        query = query.eq('user_id', resolvedUserId);
    }

    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.log(error);
        return [];
    }

    return (data as Playlist[]) ?? [];
};

export default getPlaylists;