// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
        const errorDesc = requestUrl.searchParams.get('error_description') || error;
        return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(errorDesc)}`);
    }

    // Exchange code for session
    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`);
        }
    }

    return NextResponse.redirect(requestUrl.origin);
}
