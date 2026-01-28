
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&q=80';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImages() {
    console.log('🚀 Starting image fix migration...');

    // 1. Fix null values
    const { data: nullData, error: nullError } = await supabase
        .from('content')
        .update({ image_url: DEFAULT_IMAGE })
        .is('image_url', null);

    if (nullError) console.error('Error fixing nulls:', nullError);
    else console.log('✅ Fixed NULL image_urls');

    // 2. Fix empty strings
    const { data: emptyData, error: emptyError } = await supabase
        .from('content')
        .update({ image_url: DEFAULT_IMAGE })
        .eq('image_url', '');

    if (emptyError) console.error('Error fixing empty strings:', emptyError);
    else console.log('✅ Fixed empty image_urls');

    // 3. Fix invalid PornDude placeholders if needed
    // (User said they might be invalid)
    // Most already have a placeholder, but we can ensure they are consistent.

    console.log('📊 Migration complete.');
}

fixImages();
