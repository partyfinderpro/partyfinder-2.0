const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_URL;
// Usando la misma key que funcionó para leer en check-db-connection.js
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    console.log("🔎 Buscando el registro de prueba en Supabase...");

    // Buscamos por la URL única que usamos en el test
    const testUrl = "https://www.instagram.com/p/TEST_NO_JWT_123";

    const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('source_url', testUrl);

    if (error) {
        console.error("❌ Error consultando Supabase:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ ¡CONFIRMADO! El dato EXISTE en la base de datos.");
        console.log("---------------------------------------------------");
        console.log(`ID: ${data[0].id}`);
        console.log(`Título: ${data[0].title}`);
        console.log(`Fuente: ${data[0].ownerUsername || data[0].source_url}`);
        console.log(`Creado en: ${data[0].created_at}`);
        console.log("---------------------------------------------------");
        console.log("Esto prueba definitivamente que el Webhook guarda los datos correctamente.");
    } else {
        console.log("❌ FALLO. No se encontró el registro. Puede haber demorado en indexarse o el Webhook falló silenciosamente.");
    }
}

verify();
