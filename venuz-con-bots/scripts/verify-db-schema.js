const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    console.log('🔍 Verificando columnas en tabla "content"...');

    // Una forma sencilla de ver si las columnas existen es intentar un select pequeño de ellas
    const columnsToCheck = ['rating', 'price_level', 'location_text', 'reviews_count', 'active', 'category'];

    const { data, error } = await supabase
        .from('content')
        .select(columnsToCheck.join(','))
        .limit(1);

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.error('❌ FALTAN COLUMNAS CRÍTICAS EN SUPABASE:');
            console.error(error.message);
            console.log('\n💡 Acción necesaria: Debes ejecutar el script "ojo_de_dios_update.sql" en el SQL Editor de tu Dashboard de Supabase.');
        } else {
            console.error('❌ Error inesperado:', error.message);
        }
    } else {
        console.log('✅ ¡Excelente! Todas las columnas necesarias existen en la base de datos.');
    }
}

checkColumns();
