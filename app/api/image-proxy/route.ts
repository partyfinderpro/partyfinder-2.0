import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API para VENUZ
 * 
 * Soluciona el problema de 403 Forbidden en imágenes de webcams
 * al hacer proxy con headers de navegador real.
 * 
 * Uso: /api/image-proxy?url=https://img.strpchat.com/...
 */

// Dominios permitidos para proxy (solo webcams y sitios de adultos)
const ALLOWED_DOMAINS = [
    'img.strpchat.com',
    'thumb.live.mmcdn.com',     // Chaturbate
    'roomimg.stream.highwebmedia.com', // Chaturbate rooms
    'img.camsoda.com',
    'thumbs.eporner.com',
    'static-ca-cdn.eporner.com',
    'cdni.pornpics.com',
    'thumbs2.redgifs.com',
    'thumbs3.redgifs.com',
    'thumbs4.redgifs.com',
    'i.imgur.com',
    'preview.redd.it',
    // No proxy para Unsplash (ya funciona bien)
];

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);

        // Validar que el dominio está permitido
        const isAllowed = ALLOWED_DOMAINS.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            // Si no está en la lista, intentar redirigir directamente
            // (para imágenes que no necesitan proxy)
            return NextResponse.redirect(url);
        }

        // Fetch la imagen con headers de navegador
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': parsedUrl.origin,
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            console.error(`Image proxy error: ${response.status} for ${url}`);
            return NextResponse.json(
                { error: `Upstream error: ${response.status}` },
                { status: response.status }
            );
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache 5min client, 10min CDN
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Image proxy fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}

// Permitir OPTIONS para CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
