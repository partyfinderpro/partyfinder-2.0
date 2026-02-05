const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

async function verifySetup() {
    console.log('--- 🔍 VERIFICACIÓN DE CONFIGURACIÓN VENUZ ---');

    const envs = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Presente (HIDDEN)' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Presente (HIDDEN)' : 'MISSING',
        PREDICTHQ_ACCESS_TOKEN: process.env.PREDICTHQ_ACCESS_TOKEN ? 'Presente (HIDDEN)' : 'MISSING'
    };

    console.table(envs);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ Faltan las claves básicas de Supabase.');
        return;
    }

    // 1. Probar Conexión de Lectura (Anon)
    console.log('\n1. Probando lectura (ANON_KEY)...');
    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: readData, error: readError } = await supabaseAnon
        .from('content')
        .select('id')
        .limit(1);

    if (readError) {
        console.error('❌ Error de lectura:', readError.message);
    } else {
        console.log('✅ Lectura exitosa.');
    }

    // 2. Probar Conexión de Escritura (Service Role o Anon con RLS Bypass)
    console.log('\n2. Probando escritura...');
    const writeKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`Usando clave: ${isServiceRole ? 'SERVICE_ROLE' : 'ANON_KEY'}`);

    const supabaseWrite = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        writeKey
    );

    const testItem = {
        title: 'TEST_DELETE_ME',
        description: 'Test insertion',
        category: 'test',
        active: false, // Inactivo para no ensuciar el feed
        location: 'Debug City',
        source_url: 'https://test.com'
    };

    const { data: writeData, error: writeError } = await supabaseWrite
        .from('content')
        .insert([testItem])
        .select();

    if (writeError) {
        console.error('❌ Error de escritura:', writeError.message);
        if (writeError.code === '42501') {
            console.error('👉 CAUSA: Permisos RLS. Necesitas la SUPABASE_SERVICE_ROLE_KEY.');
        }
    } else {
        console.log('✅ Escritura exitosa! ID:', writeData[0].id);

        // Limpiar test
        await supabaseWrite.from('content').delete().eq('id', writeData[0].id);
        console.log('✅ Test limpiado.');
    }

    // 3. Probar PredictHQ
    if (process.env.PREDICTHQ_ACCESS_TOKEN) {
        console.log('\n3. Probando PredictHQ API...');
        try {
            const response = await fetch('https://api.predicthq.com/v1/events/?limit=1', {
                headers: { 'Authorization': `Bearer ${process.env.PREDICTHQ_ACCESS_TOKEN}` }
            });
            if (response.ok) {
                console.log('✅ PredictHQ responde correctamente.');
            } else {
                console.error('❌ PredictHQ error stats:', response.status);
            }
        } catch (e) {
            console.error('❌ PredictHQ exception:', e.message);
        }
    }
}

verifySetup().catch(console.error);
