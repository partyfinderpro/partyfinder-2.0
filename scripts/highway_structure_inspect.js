const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable(tableName) {
    console.log(`\n--- 🕵️ ESTRUCTURA DE ${tableName} ---`);

    // Como no podemos ejecutar SQL arbitrario directamente vía el cliente (salvo vía RPC),
    // vamos a obtener un registro para deducir las columnas.
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`❌ Error al inspeccionar ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Columnas detectadas (vía data sample):');
        const cols = Object.keys(data[0]);
        console.log(cols.join(', '));
        console.log('Sample data:', data[0]);
    } else {
        // Si la tabla está vacía, intentamos seleccionar sólo las columnas si PostgREST nos deja o simplemente reportamos vacío.
        console.log('⚠️ La tabla está vacía. No se puede deducir estructura por sample.');
        // Plan C: Intentar algo que falle pero nos dé pistas o usar una query de introspección si el usuario nos dio permisos.
    }
}

async function runAudit() {
    const tables = ['content_scores', 'feed_history', 'category_weights'];
    for (const t of tables) {
        await inspectTable(t);
    }
}

runAudit().catch(console.error);
