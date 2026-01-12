// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Refrescar sesión si existe
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Log para debugging
    console.log('[Middleware] Path:', req.nextUrl.pathname);
    console.log('[Middleware] Session exists:', !!session);

    return res;
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
    matcher: [
        /*
         * Match todas las rutas excepto:
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes)
         * - favicon.ico (favicon)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
