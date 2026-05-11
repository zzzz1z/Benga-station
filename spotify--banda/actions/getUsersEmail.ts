import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const getUsersEmail = async (): Promise<string[]> => {
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

    const { data, error } = await supabase.from('users').select('email');
    if (error) { console.error("Error fetching emails:", error); return []; }

    return data?.map((user: { email: string }) => user.email) ?? [];
};

export default getUsersEmail;