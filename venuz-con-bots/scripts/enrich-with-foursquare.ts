const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ⚙️ CONFIGURACIÓN
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📍 FALLBACK LOCATION (PUERTO VALLARTA)
const DEFAULT_LL = '20.6534,-105.2253';

async function buscarEnFoursquare(query, locationText) {
    if (!FOURSQUARE_API_KEY) return null;

    // Si tenemos texto de ubicación, intentar usarlo, si no, usar default LL
    const llParam = DEFAULT_LL;
    // Nota: Foursquare v3 es mejor con "near" si es texto, o "ll" si son coords.
    // Vamos a priorizar búsqueda por "near" si tenemos un texto de ciudad,
    // pero como locationText suele ser sucio ("Av. Principal 123"), mejor usamos bias de LL.

    const searchUrl = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&ll=${llParam}&limit=1`;

    try {
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': FOURSQUARE_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0] : null;
    } catch (error) {
        console.error(`Error buscando ${query}:`, error.message);
        return null;
    }
}

async function obtenerFoto(fsqId) {
    try {
        const url = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`;
        const response = await fetch(url, {
            headers: {
                'Authorization': FOURSQUARE_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return null;
        const photos = await response.json();
        if (photos && photos.length > 0) {
            const photo = photos[0];
            return `${photo.prefix}800x600${photo.suffix}`;
        }
        return null;
    } catch (e) { return null; }
}

async function main() {
    console.log('🚀 Iniciando Enriquecimiento de Datos (Foursquare Mode)...');

    if (!FOURSQUARE_API_KEY) {
        console.error('❌ Falta FOURSQUARE_API_KEY en .env.local');
        process.exit(1);
    }

    // 1. Obtener items sin Latitud/Longitud o sin Rating (candidatos a enriquecer)
    const { data: posts, error } = await supabase
        .from('content')
        .select('*')
        .is('lat', null) // Priorizamos los que no tienen ubicación
        .limit(50); // Lotes pequeños para no saturar

    if (error) {
        console.error('Error leyendo Supabase:', error);
        return;
    }

    console.log(`📦 Encontrados ${posts.length} posts para enriquecer.`);

    for (const post of posts) {
        console.log(`\n🔍 Procesando: "${post.title}"...`);

        // Buscar en FSQ
        const lugar = await buscarEnFoursquare(post.title, post.location); // location es la columna vieja cruda

        if (lugar) {
            console.log(`   ✅ Encontrado en FSQ: ${lugar.name}`);

            const updateData = {
                lat: lugar.geocodes?.main?.latitude,
                lng: lugar.geocodes?.main?.longitude,
                location_text: lugar.location?.formatted_address || lugar.location?.address,
                external_ids: {
                    ...(post.external_ids || {}),
                    foursquare: lugar.fsq_id
                },
                // Solo sobrescribir rating si no existe o es 0
                rating: (!post.rating) ? (lugar.rating ? lugar.rating / 2 : null) : post.rating,
                price_level: lugar.price || post.price_level,
                updated_at: new Date().toISOString()
            };

            // Si no tenía foto, intentar traer una de FSQ
            if (!post.image_url || post.image_url.includes('placeholder')) {
                const foto = await obtenerFoto(lugar.fsq_id);
                if (foto) updateData.image_url = foto;
            }

            const { error: updateError } = await supabase
                .from('content')
                .update(updateData)
                .eq('id', post.id);

            if (!updateError) console.log('   💾 Actualizado en DB.');
            else console.error('   ❌ Error al actualizar:', updateError.message);

        } else {
            console.log('   ⚠️ No encontrado en Foursquare.');
            // Opcional: Marcar como "checked" para no reintentar siempre
        }

        // Rate limit preventivo
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n🏁 Enriquecimiento completado.');
}

main();
