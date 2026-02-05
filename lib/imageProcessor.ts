import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// Init Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProcessedImages {
    thumbnail: string;
    medium: string;
    large: string;
}

export async function processAndUploadImage(
    originalUrl: string,
    contentId: string
): Promise<ProcessedImages | null> {
    let buffer: Buffer;

    try {
        buffer = await fetchWithRetry(originalUrl);
    } catch (error) {
        console.error(`[ImageProcessor] Download failed: ${originalUrl}`);
        return null;
    }

    let image;
    try {
        image = sharp(buffer);
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) throw new Error('Invalid dimensions');
        // Optional: Filter out tiny images
        if (metadata.width < 200 || metadata.height < 200) {
            console.warn(`[ImageProcessor] Image too small: ${metadata.width}x${metadata.height}`);
        }
    } catch (error) {
        console.error(`[ImageProcessor] Corrupt or invalid image data`);
        return null;
    }

    const basePath = `content/${contentId}`;

    try {
        // 1. Thumbnail (400x400 cover)
        const thumbnailBuffer = await image
            .clone()
            .resize(400, 400, { fit: 'cover', position: 'center' })
            .webp({ quality: 80 })
            .toBuffer();

        // 2. Medium (1080x1920 mobile portrait optimized)
        const mediumBuffer = await image
            .clone()
            .resize(1080, null, { fit: 'inside', withoutEnlargement: true }) // Maintain aspect ratio, max width 1080
            .webp({ quality: 85 })
            .toBuffer();

        // 3. Large (1920x1080 desktop optimized)
        const largeBuffer = await image
            .clone()
            .resize(1920, null, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer();

        // Parallel Upload
        const [thumbRes, medRes, largeRes] = await Promise.all([
            supabase.storage.from('images').upload(`${basePath}/thumb.webp`, thumbnailBuffer, { contentType: 'image/webp', upsert: true }),
            supabase.storage.from('images').upload(`${basePath}/medium.webp`, mediumBuffer, { contentType: 'image/webp', upsert: true }),
            supabase.storage.from('images').upload(`${basePath}/large.webp`, largeBuffer, { contentType: 'image/webp', upsert: true }),
        ]);

        if (thumbRes.error) console.warn('[ImageProcessor] Thumb upload error:', thumbRes.error.message);
        if (medRes.error) console.warn('[ImageProcessor] Medium upload error:', medRes.error.message);
        if (largeRes.error) console.warn('[ImageProcessor] Large upload error:', largeRes.error.message);

        // Get Public URLs
        const { data: thumbPublic } = supabase.storage.from('images').getPublicUrl(`${basePath}/thumb.webp`);
        const { data: medPublic } = supabase.storage.from('images').getPublicUrl(`${basePath}/medium.webp`);
        const { data: largePublic } = supabase.storage.from('images').getPublicUrl(`${basePath}/large.webp`);

        return {
            thumbnail: thumbPublic.publicUrl,
            medium: medPublic.publicUrl,
            large: largePublic.publicUrl,
        };
    } catch (error: any) {
        console.error(`[ImageProcessor] Processing failed: ${error.message}`);
        return null;
    }
}

async function fetchWithRetry(url: string, retries = 3): Promise<Buffer> {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return Buffer.from(await response.arrayBuffer());
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    throw new Error('Unreachable');
}
