const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
    console.log('🔍 Inspecting DB Content...');

    // Count total rows
    const { count, error: countError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Count Error:', countError);
    console.log(`📊 Total Rows in 'content': ${count}`);

    // Fetch a sample
    const { data, error } = await supabase
        .from('content')
        .select('id, title, lat, lng, rating, location_text')
        .limit(5);

    if (error) console.error('Fetch Error:', error);
    else console.table(data);
}

inspect();
