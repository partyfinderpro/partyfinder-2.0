
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require('dotenv').config({ path: '.env.local' }).parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function countDirty() {
    const { count, error } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .ilike('affiliate_url', '%theporndude.com%');

    if (error) {
        console.error("❌ Error counting dirty links:", error.message);
        return;
    }

    console.log(`📊 Dirty links (theporndude.com): ${count}`);

    const { count: total, error: totalError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total items in 'content' table: ${total}`);
}

countDirty();
