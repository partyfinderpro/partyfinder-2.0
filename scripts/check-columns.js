const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkColumns() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // This query is a trick to get column names in Supabase/PostgREST
    const { data, error } = await supabase
        .from('content')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data in content table, cannot infer columns this way.');
        // Try to insert a blank row or use information_schema
        const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'content' });
        if (colError) {
            console.log('RPC get_table_columns not found, trying direct SQL via REST is not possible easily.');
            // Just try to fetch an empty object
            const { data: empty, error: emptyError } = await supabase.from('content').select().limit(0);
            console.log('Empty select headers might help if we had the response object, but we only get data.');
        } else {
            console.log('Columns (from RPC):', cols);
        }
    }
}

checkColumns();
