// scripts/migrateMedia.ts
import { createClient } from '@supabase/supabase-js';

// CREDENCIALES DIRECTAS PARA EVITAR ERRORES DE .ENV
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MICROLINK_API = 'https://api.microlink.io';

async function extractMedia(url: string) {
    try {
        const response = await fetch(
            `${MICROLINK_API}?url=${encodeURIComponent(url)}&screenshot=true`
        );
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            return {
                image_url: data.data.image?.url || data.data.screenshot?.url,
                thumbnail_url: data.data.logo?.url,
                video_url: data.data.video?.url || null,
            };
        }
    } catch (e) {
        console.warn('Microlink failed:', e);
    }
    return {
        image_url: `https://image.thum.io/get/width/1280/${url}`,
        thumbnail_url: `https://image.thum.io/get/width/400/${url}`,
        video_url: null,
    };
}

async function migrate() {
    console.log('🚀 Iniciando migración de media (Modo Directo)...');

    const { data: contents, error } = await supabase
        .from('content')
        .select('id, title, affiliate_url, image_url')
        .or('image_url.is.null,image_url.ilike.%unsplash%')
        .not('affiliate_url', 'is', null)
        .limit(500); // Aumentado a 500 para procesar más rápido

    if (error) {
        console.error('❌ Error Supabase:', error);
        return;
    }

    console.log(`📦 Encontrados ${contents?.length || 0} items para procesar.`);

    for (const item of contents || []) {
        try {
            console.log(`\n🔄 Procesando: ${item.title}`);
            const media = await extractMedia(item.affiliate_url);

            const { error: updateError } = await supabase
                .from('content')
                .update({
                    image_url: media.image_url,
                    thumbnail_url: media.thumbnail_url,
                    video_url: media.video_url,
                })
                .eq('id', item.id);

            if (updateError) console.error(`❌ Falló la actualización:`, updateError);
            else console.log(`✅ ¡Éxito! Imagen: ${media.image_url?.substring(0, 50)}...`);

            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.error(`❌ Error en ${item.id}:`, e);
        }
    }
    console.log(`\n🏁 ¡Lote completado!`);
}

migrate();
