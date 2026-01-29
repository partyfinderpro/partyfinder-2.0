
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Parse .env specifically to get the service_role key
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY; // This is actually service_role

console.log('Using URL:', supabaseUrl);
console.log('Using Key (first 20 chars):', supabaseKey.substring(0, 20));

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&q=80';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImages() {
    console.log('🚀 Starting image fix migration with service_role...');

    // Test a single update first
    const { data: testRecords } = await supabase.from('content').select('id').is('image_url', null).limit(1);
    if (testRecords && testRecords.length > 0) {
        console.log('Found null records, attempting update...');
        const { error: updateError } = await supabase
            .from('content')
            .update({ image_url: DEFAULT_IMAGE })
            .is('image_url', null);

        if (updateError) {
            console.error('Update ERROR:', updateError);
        } else {
            console.log('✅ Update successful for NULL values.');
        }
    } else {
        console.log('No NULL image_url records found.');
    }

    const { error: emptyError } = await supabase
        .from('content')
        .update({ image_url: DEFAULT_IMAGE })
        .eq('image_url', '');

    if (emptyError) {
        console.error('Empty update ERROR:', emptyError);
    } else {
        console.log('✅ Update successful for empty strings.');
    }

    console.log('📊 Migration complete.');
}

fixImages();
