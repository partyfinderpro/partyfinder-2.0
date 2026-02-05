
require('dotenv').config({ path: '.env.local' });
const PredictHQAPI = require('./connectors/predicthq');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function ingestPredictHQ() {
    console.log("🚀 Iniciando ingestión de PredictHQ...");

    const api = new PredictHQAPI();

    // Coordenadas de prueba (Guadalajara Centro)
    const lat = 20.659698;
    const lon = -103.349609;

    const events = await api.search({
        latitude: lat,
        longitude: lon,
        radius: '20km'
    });

    console.log(`   Encontrados ${events.length} eventos.`);

    if (events.length > 0) {
        // Enriquecer con imágenes placeholder de Unsplash si vienen nulas (común en PredictHQ)
        const enrichedEvents = events.map(ev => ({
            ...ev,
            image_url: ev.image_url || `https://source.unsplash.com/800x600/?party,concert,${ev.subcategory}`
        }));

        const { error } = await supabase
            .from('content')
            .upsert(enrichedEvents, { onConflict: 'external_id' }); // Usar ID externo para evitar duplicados

        if (error) {
            console.error(`   ❌ Error guardando en DB: ${error.message}`);
        } else {
            console.log(`   ✅ Guardados en DB.`);
        }
    }

    console.log("\n🏁 Proceso terminado.");
}

ingestPredictHQ();
