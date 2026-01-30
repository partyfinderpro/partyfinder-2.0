// lib/mediaExtractor.ts
const MICROLINK_API = 'https://api.microlink.io';

export interface ExtractedMedia {
    image_url: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    logo_url: string | null;
    og_title: string | null;
    og_description: string | null;
}

export async function extractMediaFromUrl(url: string): Promise<ExtractedMedia> {
    if (!url) return getDefaultMedia(url);

    try {
        // Añadimos &video=true para intentar capturar previews de video directamente
        const response = await fetch(
            `${MICROLINK_API}?url=${encodeURIComponent(url)}&screenshot=true&meta=true&video=true&palette=true`,
            {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(12000)
            }
        );

        const data = await response.json();

        if (data.status === 'success' && data.data) {
            const domain = new URL(url).hostname;

            // ESTRATEGIA INTELIGENTE: 
            // Si es un sitio conocido por tener el mismo logo en todo (como aggregators), 
            // priorizamos el SCREENSHOT sobre la imagen OG para que cada card sea única.
            const isAggregator = url.includes('theporndude') || url.includes('dir') || url.includes('list');

            return {
                // Si es aggregator, forzamos screenshot para variedad
                image_url: isAggregator
                    ? (data.data.screenshot?.url || data.data.image?.url)
                    : (data.data.image?.url || data.data.screenshot?.url),

                thumbnail_url: data.data.logo?.url || null,
                video_url: data.data.video?.url || null, // ¡Aquí vienen los videos!
                logo_url: data.data.logo?.url || `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
                og_title: data.data.title || domain,
                og_description: data.data.description || null,
            };
        }
    } catch (error) {
        console.warn('[MediaExtractor] Microlink failed, using Thum.io fallback');
    }

    return getScreenshotFallback(url);
}

function getScreenshotFallback(url: string): ExtractedMedia {
    try {
        const domain = new URL(url).hostname;
        return {
            // Thum.io genera capturas frescas de la URL exacta, garantizando que no se repitan
            image_url: `https://image.thum.io/get/width/1280/crop/800/noanimate/${url}`,
            thumbnail_url: `https://image.thum.io/get/width/400/noanimate/${url}`,
            video_url: null,
            logo_url: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
            og_title: domain.replace('www.', ''),
            og_description: null,
        };
    } catch {
        return getDefaultMedia(url);
    }
}

function getDefaultMedia(url: string): ExtractedMedia {
    return {
        image_url: '/placeholder-content.jpg',
        thumbnail_url: null,
        video_url: null,
        logo_url: '/placeholder-logo.png',
        og_title: 'Premium Content',
        og_description: null,
    };
}
