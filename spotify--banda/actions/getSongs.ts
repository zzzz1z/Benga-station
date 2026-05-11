import { Song } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getSongs = async (search?: string): Promise<Song[]> => {
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

        let query = supabase
            .from("Songs")
            .select("*")
            

        if (search) {
            query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });;

        if (error) {
            console.error("Erro ao buscar músicas:", error.message);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Erro inesperado ao buscar músicas:", err);
        return [];
    }
};

export default getSongs;