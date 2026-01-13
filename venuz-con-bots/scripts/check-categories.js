const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
    const { data, error } = await supabase
        .from('content')
        .select('title, category, google_place_id')
        .in('title', ['La Santa', 'Mandala Puerto Vallarta', 'La Vaquita', 'Strana']);

    if (error) console.error(error);
    else console.table(data);
}

checkCategories();
