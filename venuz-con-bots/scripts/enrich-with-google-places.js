/**
 * VENUZ - Google Places Data Enrichment (JS Version)
 * Busca información detallada (rating, horario, mapa) para el contenido existente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function searchGooglePlace(name, location = 'Puerto Vallarta') {
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY no configurada');

    const query = `${name} ${location}`;
    console.log(`🔍 Buscando: ${query}`);

    const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,rating,opening_hours&key=${GOOGLE_API_KEY}`
    );

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
        const placeId = data.candidates[0].place_id;

        // Get detailed info
        const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,opening_hours,formatted_phone_number,website,url,price_level,formatted_address&key=${GOOGLE_API_KEY}`
        );

        const details = await detailsResponse.json();
        return details.result;
    } else {
        console.log(`⚠️ Debug Google Response for '${query}':`, JSON.stringify(data));
    }

    return null;
}

async function enrichContent() {
    console.log('🚀 Iniciando Enriquecimiento de Datos (Google Places)...');

    if (!GOOGLE_API_KEY) {
        console.error('❌ GOOGLE_PLACES_API_KEY no encontrada.');
        return;
    }

    // 1. Obtener contenido sin datos de Google (o que falló antes)
    const { data: contents, error: fetchError } = await supabase
        .from('content')
        .select('*')
        .or('google_place_id.is.null,google_place_id.eq.NOT_FOUND')
        .limit(10); // Procesar de 10 en 10

    if (fetchError) {
        console.error('❌ Error cargando contenido:', fetchError);
        return;
    }

    if (!contents || contents.length === 0) {
        console.log('✅ Todo el contenido ya está enriquecido.');
        return;
    }

    console.log(`📦 Procesando ${contents.length} lugares...`);

    for (const content of contents) {
        try {
            // 2. Buscar en Google Places API
            const placeData = await searchGooglePlace(content.title, content.location_text || 'Puerto Vallarta');

            if (placeData) {
                // 3. Actualizar Supabase con datos enriquecidos
                const updatePayload = {
                    rating: placeData.rating,
                    total_ratings: placeData.user_ratings_total, // Mapped to existing column
                    // is_open_now: placeData.opening_hours?.open_now, 
                    google_maps_url: placeData.url,
                    google_place_id: placeData.place_id || 'FOUND_BUT_NO_ID',
                    phone: placeData.formatted_phone_number, // Mapped to existing column
                    website: placeData.website,
                    price_level: placeData.price_level,
                    // formatted_address: placeData.formatted_address // Column doesn't exist, omit
                };

                // Si hay horarios (weekday_text es array de strings)
                if (placeData.opening_hours && placeData.opening_hours.weekday_text) {
                    updatePayload.opening_hours = placeData.opening_hours.weekday_text;
                }

                const { error: updateError } = await supabase
                    .from('content')
                    .update(updatePayload)
                    .eq('id', content.id);

                if (updateError) {
                    console.error(`❌ Error actualizando ${content.title}:`, updateError.message);
                } else {
                    console.log(`✅ Enriquecido: ${content.title} (Rating: ${placeData.rating} ⭐)`);
                }
            } else {
                console.log(`⚠️ No se encontró lugar en Google para: ${content.title}`);
                // Marcar como procesado para no reintentar siempre
                await supabase.from('content').update({ google_place_id: 'NOT_FOUND' }).eq('id', content.id);
            }
        } catch (error) {
            console.error(`❌ Error crítico con ${content.title}:`, error.message);
        }

        // Rate limiting para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

enrichContent().catch(console.error);
