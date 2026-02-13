const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    console.log('--- 🔍 AUDITORÍA DE TABLAS SUPABASE ---');

    // Query to list tables in public schema
    // We can't use raw SQL via the client easily, but we can try to guess or use an RPC if available.
    // However, most Supabase projects have 'rpc' enabled for information_schema if explicitly created.
    // Since I don't know if there's an RPC, I'll try to perform a common query that often works if the API is open.

    // Plan B: Test existence of the specifically required tables one by one.
    const tablesToCheck = [
        'user_interactions',
        'content_scores',
        'feed_history',
        'category_weights',
        'content',
        'profiles',
        'messages',
        'analytics_events',
        'pending_events',
        'dev_tasks',
        'ab_analytics',
        'affiliate_conversions',
        'push_subscriptions'
    ];

    console.log('Verificando tablas del Highway Algorithm y sistema...');

    const results = [];
    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(0);
        if (error && error.code === '42P01') {
            results.push({ table, status: '❌ MISSING' });
        } else if (error) {
            // Table exists but maybe permission issue or column 'id' missing
            // Try a different check for column-less or id-less tables
            const { error: error2 } = await supabase.from(table).select('*').limit(0);
            if (error2 && error2.code === '42P01') {
                results.push({ table, status: '❌ MISSING' });
            } else {
                results.push({ table, status: '✅ EXISTS (Error: ' + error.code + ')' });
            }
        } else {
            results.push({ table, status: '✅ EXISTS' });
        }
    }

    console.table(results);
}

listTables().catch(console.error);
