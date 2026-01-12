import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verifyOjoDeDiosSchema() {
    console.log('🔍 Verificando Schema "Ojo de Dios"...');

    const { data, error } = await supabase.from('content').select('*').limit(1);

    if (error) {
        console.error('❌ Error al conectar con Supabase:', error.message);
        return;
    }

    if (data && data.length >= 0) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const requiredColumns = [
            'price_level',
            'rating',
            'reviews_count',
            'external_ids',
            'metadata',
            'min_price',
            'max_price'
        ];

        console.log('\n📊 Estado de Columnas:');
        requiredColumns.forEach(id => {
            const exists = columns.includes(id);
            console.log(`${exists ? '✅' : '❌'} ${id}`);
        });

        const missing = requiredColumns.filter(c => !columns.includes(c));
        if (missing.length === 0) {
            console.log('\n🚀 ¡TODO LISTO! El schema es compatible con El Ojo de Dios.');
        } else {
            console.error(`\n⚠️ FALTAN COLUMNAS: ${missing.join(', ')}`);
            console.log('👉 Por favor ejecuta supabase/ojo_de_dios_update.sql en tu Dashboard.');
        }
    }
}

verifyOjoDeDiosSchema();
