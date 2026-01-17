
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role if available for unlimited access

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkContent() {
    console.log('--- DIAGNOSING CONTENT TABLE ---');

    // 1. Total Count
    const { count: totalCount, error: countError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting content:', countError);
    } else {
        console.log(`Total rows in 'content': ${totalCount}`);
    }

    // 2. Active Count
    const { count: activeCount, error: activeError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

    if (activeError) {
        console.error('Error counting active content:', activeError);
    } else {
        console.log(`Total ACTIVE rows: ${activeCount}`);
    }

    // 3. Sample Data (if any)
    if (totalCount > 0) {
        const { data, error } = await supabase
            .from('content')
            .select('id, title, category, active, verified')
            .limit(5);

        if (error) console.error(error);
        else {
            console.log('\nSample Data:');
            console.table(data);
        }
    } else {
        console.log('\n❌ TABLE IS EMPTY. Feed is empty because there is no data.');
    }
}

checkContent();
