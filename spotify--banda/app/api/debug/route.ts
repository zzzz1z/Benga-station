export async function GET() {
    return Response.json({
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
}