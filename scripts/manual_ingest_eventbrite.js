
require('dotenv').config({ path: '.env.local' });
const EventbriteAPI = require('./connectors/eventbrite');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function ingestEvents() {
    console.log("🚀 Iniciando ingestión de Eventbrite...");

    const api = new EventbriteAPI();

    // Coordenadas de prueba (Usuario posiblemente en CDMX o GDL según reporte de 'El Chacal')
    // Vamos a buscar en CDMX, GDL y MTY para asegurar cobertura
    const locations = [
        { name: 'Guadalajara', lat: 20.659698, lon: -103.349609 },
        { name: 'CDMX', lat: 19.432608, lon: -99.133209 },
        { name: 'Monterrey', lat: 25.686613, lon: -100.316116 }
    ];

    let totalImported = 0;

    for (const loc of locations) {
        console.log(`\n📍 Buscando en ${loc.name}...`);
        const events = await api.search({
            latitude: loc.lat,
            longitude: loc.lon,
            radius: '20km'
        });

        console.log(`   Encontrados ${events.length} eventos.`);

        if (events.length > 0) {
            const { error } = await supabase
                .from('content')
                .upsert(events, { onConflict: 'source_url' });

            if (error) {
                console.error(`   ❌ Error guardando en DB: ${error.message}`);
            } else {
                console.log(`   ✅ Guardados en DB.`);
                totalImported += events.length;
            }
        }
    }

    console.log(`\n🏁 Proceso terminado. Total nuevos eventos: ${totalImported}`);
}

ingestEvents();
