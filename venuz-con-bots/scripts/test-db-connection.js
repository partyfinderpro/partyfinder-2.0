const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('--- DB Connection Test ---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'MISSING');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Present' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'MISSING');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('❌ Missing URL or Key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('Connecting to Supabase...');
    const { data, error } = await supabase.from('content').select('*').limit(1);

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Success! Columns found:');
        if (data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log('Table is empty.');
            // Try to get column names from information_schema if possible, 
            // but select * on empty table usually returns nothing in JS client.
            // Let's try to insert a dummy and rollback or just check error if column missing.
        }
    }
}

test();
