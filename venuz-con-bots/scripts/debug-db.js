const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    console.log('🔍 Verificando tabla content...');

    // 1. Count total rows
    const { count, error: countError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Error counting:', countError);
    console.log(`📊 Total rows: ${count}`);

    // 2. Fetch one row to see structure
    const { data, error } = await supabase
        .from('content')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching:', error);
    } else if (data.length > 0) {
        console.log('📝 Sample row keys:', Object.keys(data[0]));
        console.log('📝 minimal sample:', {
            id: data[0].id,
            title: data[0].title,
            google_place_id: data[0].google_place_id
        });
    } else {
        console.log('⚠️ Table is empty');
    }
}

checkContent();
