const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVectorDimension() {
    console.log('🔍 Verificando estructura de vectores en Supabase...');

    // Consultar el tipo de dato y dimensiones de la columna embedding
    const { data, error } = await supabase.rpc('get_column_info', {
        table_name: 'content',
        column_name: 'embedding'
    });

    if (error) {
        console.log('⚠️ No se pudo usar RPC. Intentando inspección por API...');
        const { data: sample, error: fetchError } = await supabase
            .from('content')
            .select('embedding')
            .not('embedding', 'is', null)
            .limit(1);

        if (fetchError) {
            console.error('❌ Error al consultar la tabla:', fetchError.message);
        } else if (sample && sample.length > 0) {
            const dim = JSON.parse(sample[0].embedding).length;
            console.log(`✅ Embedding encontrado. Dimensión: ${dim}`);
        } else {
            console.log('❓ No hay embeddings guardados para verificar la dimensión.');
        }
    } else {
        console.log('📊 Información de columna:', data);
    }
}

checkVectorDimension();
