// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('🔐 [Auth Callback] Route handler triggered');
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        try {
            console.log('🔐 [Auth Callback] Exchanging code for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('🔐 [Auth Callback] Exchange error:', error);
                return NextResponse.redirect(`${requestUrl.origin}/auth-error?message=${encodeURIComponent(error.message)}`);
            }

            console.log('🔐 [Auth Callback] Session created successfully');
        } catch (error: any) {
            console.error('🔐 [Auth Callback] Unexpected error:', error);
            return NextResponse.redirect(`${requestUrl.origin}/auth-error?message=unexpected_error`);
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin);
}
