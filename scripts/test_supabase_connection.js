const { createClient } = require('@supabase/supabase-js');

// Configuración directa para testing
const SUPABASE_URL = "https://jbrmziwosyeructvlvrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    console.log("🔍 [1/3] Conectando a Supabase...");

    try {
        // Test 1: Verificar conexión básica (health check dummy)
        // Intentamos leer la tabla 'content' que sabemos que debería existir
        const { data, error, count } = await supabase
            .from('content')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Error de conexión/permisos:", error.message);
            console.log("\n⚠️ Diagnóstico Posible: RLS (Row Level Security) está bloqueando el acceso anónimo.");
            return;
        }

        console.log("✅ Conexión exitosa.");

        console.log("\n🔍 [2/3] Verificando datos...");
        console.log(`📊 Total de items en tabla 'content': ${count}`);

        if (count === 0) {
            console.log("⚠️ La tabla está vacía. Esto explica por qué ves los datos de prueba.");
        } else {
            // Test 3: Leer un dato real
            console.log("\n🔍 [3/3] Intentando leer el primer registro...");
            const { data: rows, error: readError } = await supabase
                .from('content')
                .select('title, category')
                .limit(1);

            if (readError) {
                console.error("❌ Error al leer registros:", readError.message);
            } else if (rows.length > 0) {
                console.log("✅ Lectura exitosa. Primer item:", rows[0]);
                console.log("\n🚀 CONCLUSIÓN: El backend funciona. Si la web falla, es un tema de Cache/Build.");
            }
        }

    } catch (err) {
        console.error("❌ Error inesperado:", err.message);
    }
}

testConnection();
