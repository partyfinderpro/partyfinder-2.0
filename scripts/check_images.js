
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log('--- Database Image Check ---');

    const { data, error, count } = await supabase
        .from('content')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const total = count;
    const withImage = data.filter(item => item.image_url && item.image_url.trim() !== '').length;
    const withoutImage = total - withImage;

    console.log(`Total records: ${total}`);
    console.log(`With image: ${withImage}`);
    console.log(`Without image: ${withoutImage}`);

    console.log('\n--- Examples (First 10) ---');
    data.slice(0, 10).forEach(item => {
        console.log(`[${item.id}] ${item.title} -> ${item.image_url}`);
    });
}

checkImages();
