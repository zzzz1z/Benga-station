import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";


export async function middleware(req: NextRequest) {



    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
    const res = NextResponse.next();
    
    const supabase = createMiddlewareClient({
        req,
        res
    }, {supabaseKey, supabaseUrl});

    await supabase.auth.getSession();
    return res;
}