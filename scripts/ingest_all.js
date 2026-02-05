require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const PredictHQAPI = require('./connectors/predicthq');
const GooglePlacesAPI = require('./connectors/google_places');
const TheSeducer = require('./bots/seducer');

async function ingestAll() {
    console.log('🚀 [VENUZ] Iniciando Ingesta Multi-Fuente (PredictHQ + Google Places)...');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const cities = [
        { name: 'CDMX', lat: 19.4326, lng: -99.1332 },
        { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
        { name: 'Puerto Vallarta', lat: 20.6534, lng: -105.2253 }
    ];

    let totalPredictHQ = 0;
    let totalGoogle = 0;
    let totalSocial = 0;

    // 1. PredictHQ
    console.log('\n--- 🌐 PROCESANDO PREDICTHQ ---');
    const phq = new PredictHQAPI();
    for (const city of cities) {
        console.log(`📍 Ciudad: ${city.name}`);
        try {
            const events = await phq.search({ latitude: city.lat, longitude: city.lng, radius: '20km' });
            if (events && events.length > 0) {
                const enriched = events.map(e => ({ ...e, location: city.name }));
                const { data, error } = await supabase.from('content').upsert(enriched, { onConflict: 'source_url', ignoreDuplicates: true }).select();
                if (error) console.error(`   ❌ Error: ${error.message}`);
                else {
                    console.log(`   ✅ +${data?.length || 0} eventos`);
                    totalPredictHQ += (data?.length || 0);
                }
            }
        } catch (err) { console.error(`   ❌ Error fatal: ${err.message}`); }
    }

    // 2. Google Places
    console.log('\n--- 🏙️ PROCESANDO GOOGLE PLACES ---');
    const google = new GooglePlacesAPI();
    for (const city of cities) {
        console.log(`📍 Ciudad: ${city.name}`);
        try {
            const places = await google.searchNearby({ latitude: city.lat, longitude: city.lng });
            if (places && places.length > 0) {
                const enriched = places.map(p => ({ ...p, location: city.name }));
                const { data, error } = await supabase.from('content').upsert(enriched, { onConflict: 'source_url', ignoreDuplicates: true }).select();
                if (error) console.error(`   ❌ Error: ${error.message}`);
                else {
                    console.log(`   ✅ +${data?.length || 0} sitios`);
                    totalGoogle += (data?.length || 0);
                }
            }
        } catch (err) { console.error(`   ❌ Error fatal: ${err.message}`); }
    }

    // 3. The Seducer (Social/Reddit)
    console.log('\n--- 💋 PROCESANDO THE SEDUCER (REDDIT) ---');
    try {
        const socialContent = await TheSeducer.scrape();
        if (socialContent && socialContent.length > 0) {
            const { data, error } = await supabase.from('content').upsert(socialContent, { onConflict: 'source_url', ignoreDuplicates: true }).select();
            if (error) console.error(`   ❌ Error: ${error.message}`);
            else {
                console.log(`   ✅ +${data?.length || 0} items sociales/XXX`);
                totalSocial += (data?.length || 0);
            }
        }
    } catch (err) { console.error(`   ❌ Error fatal: ${err.message}`); }

    console.log('\n' + '='.repeat(40));
    console.log(`✨ INGESTA FINALIZADA`);
    console.log(`📦 PredictHQ: ${totalPredictHQ} nuevos`);
    console.log(`📦 Google Places: ${totalGoogle} nuevos`);
    console.log(`📦 Social/XXX: ${totalSocial} nuevos`);
    console.log('='.repeat(40));
}

ingestAll().catch(console.error);
