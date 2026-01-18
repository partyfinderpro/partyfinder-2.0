const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Check Categories
    const { data: categories, error: catError } = await supabase
        .from('content')
        .select('category');

    if (catError) {
        console.error('Error fetching categories:', catError.message);
    } else {
        const counts = {};
        categories.forEach(c => {
            const cat = c.category || 'NULL';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        console.log('\n1. CATEGORY COUNTS:');
        console.table(counts);
    }

    // 2. Check Images for a sample
    const { data: images, error: imgError } = await supabase
        .from('content')
        .select('id, name, category, image_url, source')
        .limit(10);

    if (imgError) {
        console.error('Error fetching images:', imgError);
    } else {
        console.log('\n2. IMAGE SAMPLE (First 10):');
        images.forEach(img => {
            console.log(`- [${img.category}] ${img.name}: ${img.image_url ? 'Has URL' : 'NULL'} (${img.source})`);
            if (img.image_url) console.log(`  -> ${img.image_url.substring(0, 50)}...`);
        });
    }

    console.log('--- DIAGNOSIS END ---');
}

diagnose();
