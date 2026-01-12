// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('🔐 [Auth Callback] Route handler triggered');
    console.log('🔐 [Auth Callback] Request URL:', request.url);

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');

    // Log de parámetros recibidos
    console.log('🔐 [Auth Callback] Code:', code ? '✅ Present' : '❌ Missing');
    console.log('🔐 [Auth Callback] Error:', error || 'None');
    console.log('🔐 [Auth Callback] Error Description:', error_description || 'None');

    // Manejo de errores de OAuth
    if (error) {
        console.error('🔐 [Auth Callback] OAuth Error:', error, error_description);
        return NextResponse.redirect(
            `${requestUrl.origin}/?auth_error=${encodeURIComponent(error_description || error)}`
        );
    }

    // Intercambiar código por sesión
    if (code) {
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            console.log('🔐 [Auth Callback] Exchanging code for session...');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                console.error('🔐 [Auth Callback] Exchange error:', exchangeError);
                return NextResponse.redirect(
                    `${requestUrl.origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`
                );
            }

            console.log('🔐 [Auth Callback] Session created successfully for user:', data.user?.email);

            // Redirigir al feed principal
            return NextResponse.redirect(`${requestUrl.origin}/`);

        } catch (error) {
            console.error('🔐 [Auth Callback] Unexpected error:', error);
            return NextResponse.redirect(
                `${requestUrl.origin}/?auth_error=unexpected_error`
            );
        }
    }

    // Si no hay código ni error, redirigir al home
    console.log('🔐 [Auth Callback] No code or error, redirecting to home');
    return NextResponse.redirect(requestUrl.origin);
}
