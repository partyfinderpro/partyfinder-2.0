const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ [ImageProcessor] Missing Supabase credentials in .env. Image processing disabled.");
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET_NAME = 'images';

async function processAndUploadImage(originalUrl, contentId) {
    if (!supabase || !originalUrl) return null;

    try {
        // 1. Descargar
        // Use dynamic import for node-fetch or global fetch if available
        const fetch = global.fetch || (await import('node-fetch')).default;
        const response = await fetch(originalUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Procesar con Sharp
        const image = sharp(buffer);
        const metadata = await image.metadata();

        if (metadata.width < 200 || metadata.height < 200) {
            console.log(`   🔸 Image too small (${metadata.width}x${metadata.height}), skipping optimization.`);
            return null;
        }

        const basePath = `content/${contentId}`;

        // 3. Generar Variantes en Memoria
        // Thumbnail
        const thumbBuffer = await image.clone()
            .resize(400, 400, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

        // Medium
        const mediumBuffer = await image.clone()
            .resize(800, null, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

        // Large
        const largeBuffer = await image.clone()
            .resize(1600, null, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer();

        // 4. Subir a Supabase
        const uploadOptions = { contentType: 'image/webp', upsert: true };

        await Promise.all([
            supabase.storage.from(BUCKET_NAME).upload(`${basePath}/thumb.webp`, thumbBuffer, uploadOptions),
            supabase.storage.from(BUCKET_NAME).upload(`${basePath}/medium.webp`, mediumBuffer, uploadOptions),
            supabase.storage.from(BUCKET_NAME).upload(`${basePath}/large.webp`, largeBuffer, uploadOptions)
        ]);

        // 5. Obtener URLs Públicas
        const getUrl = (path) => supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl;

        return {
            thumbnail: getUrl(`${basePath}/thumb.webp`),
            medium: getUrl(`${basePath}/medium.webp`),
            large: getUrl(`${basePath}/large.webp`)
        };

    } catch (error) {
        console.error(`❌ [ImageProcessor] Error processing ${originalUrl}:`, error.message);
        return null;
    }
}

module.exports = { processAndUploadImage };
