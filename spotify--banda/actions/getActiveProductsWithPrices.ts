import { ProductWithPrice } from "@/types";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const getActiveProductsWithPrices = async (): Promise<ProductWithPrice[]> => {
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

    const { data, error } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true)
        .order('metadata->index')
        .order('unit_amount', { referencedTable: 'prices' });

    if (error) console.log(error);

    return (data as any) ?? [];
};

export default getActiveProductsWithPrices;