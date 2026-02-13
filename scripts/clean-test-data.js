const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_URL;
// OJO: Para borrar necesitamos la SERVICE_ROLE_KEY porque la Anon Key suele tener solo permisos de lectura/escritura propia, no borrado masivo.
// Como no la tengo "hardcodeada" aquí por seguridad, intentaré usar la Anon Key. Si falla, avisaré.
// PERO en este entorno de desarrollo local, a veces la Anon Key tiene permisos relajados. Probemos.

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanTestData() {
    console.log("🧹 Iniciando limpieza de datos de prueba...");

    const testUrls = [
        "https://www.instagram.com/p/TEST_POST_123", // Test V1
        "https://www.instagram.com/p/TEST_V2_123",   // Test V2
        "https://www.instagram.com/p/TEST_NO_JWT_123" // Test Final
    ];

    // Intentamos borrar
    const { data, error } = await supabase
        .from('content')
        .delete()
        .in('source_url', testUrls);

    if (error) {
        console.error("❌ Error al borrar (probablemente falta de permisos con Anon Key):", error.message);
        console.log("⚠️ NOTA: Si esto falla, es normal por seguridad (RLS). Lo mejor es borrarlos desde el Dashboard de Supabase -> Table Editor.");
    } else {
        // Supabase a veces no devuelve 'data' en delete, así que verificamos si siguen existiendo
        const { count } = await supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .in('source_url', testUrls);

        if (count === 0) {
            console.log("✅ ¡Limpieza exitosa! Los datos de prueba han sido eliminados.");
        } else {
            console.log(`⚠️ Se intentó borrar pero parece que ${count} registros siguen ahí. Verifica permisos RLS.`);
        }
    }
}

cleanTestData();
