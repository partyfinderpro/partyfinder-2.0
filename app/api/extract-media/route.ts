// app/api/extract-media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractMediaFromUrl } from '@/lib/mediaExtractor';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Extraer media de una URL y actualizar DB
export async function POST(request: NextRequest) {
    try {
        const { contentId, url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        console.log('[ExtractMedia] Processing:', url);

        const media = await extractMediaFromUrl(url);

        // Actualizar en Supabase si hay contentId
        if (contentId) {
            const { error } = await supabase
                .from('content')
                .update({
                    image_url: media.image_url,
                    thumbnail_url: media.thumbnail_url,
                    video_url: media.video_url,
                    // logo_url: media.logo_url, // descomentar si tienes esta columna
                })
                .eq('id', contentId);

            if (error) {
                console.error('[ExtractMedia] DB update failed:', error);
            }
        }

        return NextResponse.json({ success: true, media });
    } catch (error) {
        console.error('[ExtractMedia] Error:', error);
        return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
    }
}

// GET: Procesar batch de contenido sin imágenes
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        // Obtener contenido sin imagen real (que tenga unsplash placeholder)
        const { data: contents, error } = await supabase
            .from('content')
            .select('id, affiliate_url, image_url')
            .or('image_url.is.null,image_url.ilike.%unsplash%')
            .not('affiliate_url', 'is', null)
            .limit(limit);

        if (error) throw error;

        const processed = [];

        for (const item of contents || []) {
            if (!item.affiliate_url) continue;

            console.log(`[Batch] Processing: ${item.id}`);

            const media = await extractMediaFromUrl(item.affiliate_url);

            const { error: updateError } = await supabase
                .from('content')
                .update({
                    image_url: media.image_url,
                    thumbnail_url: media.thumbnail_url,
                    video_url: media.video_url,
                })
                .eq('id', item.id);

            processed.push({
                id: item.id,
                success: !updateError,
                image_url: media.image_url,
            });

            // Delay entre requests
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        return NextResponse.json({
            success: true,
            processed: processed.length,
            results: processed,
        });
    } catch (error) {
        console.error('[Batch] Error:', error);
        return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 });
    }
}
