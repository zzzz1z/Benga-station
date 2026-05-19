import { Song } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCache, setCache, keys, TTL } from "@/libs/cache";

const PAGE_SIZE = 15;

const getSongs = async (search?: string, page = 0): Promise<{ songs: Song[]; hasMore: boolean }> => {
    const trimmed = search?.trim() ?? '';

    if (trimmed.length === 1) return { songs: [], hasMore: false };

    const cacheKey = keys.songs(trimmed, page);
    const cached = await getCache<{ songs: Song[]; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

    try {
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

        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from("Songs")
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, to + 1);

        if (trimmed) {
            query = query.or(`title.ilike.%${trimmed}%,author.ilike.%${trimmed}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao buscar músicas:", error.message);
            return { songs: [], hasMore: false };
        }

        const results = data || [];
        const hasMore = results.length > PAGE_SIZE;
        const result = {
            songs: hasMore ? results.slice(0, PAGE_SIZE) : results,
            hasMore,
        };

        await setCache(cacheKey, result, TTL.songs);

        return result;
    } catch (err) {
        console.error("Erro inesperado ao buscar músicas:", err);
        return { songs: [], hasMore: false };
    }
};

export default getSongs;