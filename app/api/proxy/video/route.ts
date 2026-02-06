// app/api/proxy/video/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new Response('URL required', { status: 400 });
    }

    try {
        // Validar URL
        new URL(url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; VENUZ-Bot/1.0; +https://venuz.love)',
                'Accept': 'video/*,image/*,*/*',
                'Referer': new URL(url).origin,
            },
        });

        if (!response.ok) {
            return new Response('Media not found', { status: 404 });
        }

        const contentType = response.headers.get('Content-Type') || 'video/mp4';
        const contentLength = response.headers.get('Content-Length');

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Access-Control-Allow-Origin', '*');

        // CACHING AGRESIVO (24 horas + stale-while-revalidate de 7 días)
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        // Streaming response para videos grandes
        return new NextResponse(response.body, { headers });
    } catch (error) {
        console.error('Video proxy error:', error);
        return new Response('Error fetching media', { status: 500 });
    }
}

// Configuración para permitir respuestas grandes
export const runtime = 'edge';
