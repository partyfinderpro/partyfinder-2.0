const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // Get items WITH rating
    const { data: withRating, error: err1 } = await supabase
        .from('content')
        .select('title, rating, category, location_text')
        .not('rating', 'is', null)
        .limit(10);

    // Get items WITHOUT rating
    const { data: withoutRating, error: err2 } = await supabase
        .from('content')
        .select('title, rating, category')
        .is('rating', null)
        .limit(10);

    console.log('📊 VENUES CON RATING:');
    console.table(withRating || []);

    console.log('\n📊 VENUES SIN RATING:');
    console.table(withoutRating || []);

    console.log(`\n✅ Con rating: ${withRating?.length || 0}`);
    console.log(`❌ Sin rating: ${withoutRating?.length || 0}`);
}

main();
