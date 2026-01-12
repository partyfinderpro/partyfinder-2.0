
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verifyGoogleColumns() {
    console.log('🔍 Verificando columnas de Google Places...');

    const { data, error } = await supabase.from('content').select('*').limit(1);

    if (error) {
        console.error('❌ Error al conectar con Supabase:', error.message);
        return;
    }

    if (data && data.length >= 0) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const requiredColumns = [
            'google_place_id',
            'opening_hours',
            'total_ratings',
            'website',
            'phone',
            'is_open_now'
        ];

        console.log('\n📊 Estado de Columnas Google:');
        const missing = [];
        requiredColumns.forEach(id => {
            const exists = columns.includes(id);
            console.log(`${exists ? '✅' : '❌'} ${id}`);
            if (!exists) missing.push(id);
        });

        if (missing.length === 0) {
            console.log('\n🚀 ¡EXCELENTE! Base de datos lista para Google Places.');
        } else {
            console.error(`\n⚠️ FALTAN COLUMNAS: ${missing.join(', ')}`);
        }
    }
}

verifyGoogleColumns();
