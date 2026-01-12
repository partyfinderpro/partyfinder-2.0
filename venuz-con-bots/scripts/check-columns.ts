import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkColumns() {
    const { data, error } = await supabase.from('content').select('*').limit(1);
    if (error) {
        console.error('❌ Error selecting from content:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Columnas encontradas:', Object.keys(data[0]));
    } else {
        console.log('📭 La tabla content está vacía o no existe.');
    }
}

checkColumns();
