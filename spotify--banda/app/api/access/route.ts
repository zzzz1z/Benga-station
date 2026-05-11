import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing env vars:', {
                url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            });
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('AccessCodes')
            .select('id')
            .eq('code', code)
            .eq('active', true)
            .maybeSingle();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ valid: !!data });

    } catch (err: any) {
        console.error('Access route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}