const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCategories() {
    console.log('📊 Analizando categorías en la base de datos...\n');

    const { data, error } = await supabase
        .from('content')
        .select('category');

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Count categories
    const cats = {};
    data.forEach(r => {
        const cat = r.category || 'NULL';
        cats[cat] = (cats[cat] || 0) + 1;
    });

    console.log('📋 Breakdown de categorías:');
    console.table(cats);
    console.log(`\n📈 Total items: ${data.length}`);

    // Count nulls
    const nullCount = cats['NULL'] || 0;
    console.log(`\n⚠️ Items sin categoría (NULL): ${nullCount}`);
}

analyzeCategories();
