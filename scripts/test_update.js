
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&q=80';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log('--- Testing Update ---');

    // Get one record that has null image
    const { data: records } = await supabase
        .from('content')
        .select('id, title, image_url')
        .is('image_url', null)
        .limit(1);

    if (!records || records.length === 0) {
        console.log('No records with null image found.');
        return;
    }

    const record = records[0];
    console.log(`Testing with record: ${record.id} (${record.title})`);

    const { data, error } = await supabase
        .from('content')
        .update({ image_url: DEFAULT_IMAGE })
        .eq('id', record.id)
        .select();

    if (error) {
        console.error('Update ERROR:', error);
    } else {
        console.log('Update result:', data);
    }
}

testUpdate();
