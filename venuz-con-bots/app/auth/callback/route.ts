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
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njg4NDEsImV4cCI6MjA4MjU0NDg0MX0.PCZABM-pfQ6XH2qchLqWH9s-O1J6rGnWqySnx1InsmY'
        );


        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`);
        }
    }

    return NextResponse.redirect(requestUrl.origin);
}
