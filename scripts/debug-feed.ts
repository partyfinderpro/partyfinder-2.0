
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load env
const envLoc = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLoc });
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function debugFeed() {
    console.log('🚀 Starting Feed Debug...');

    // Need to extract Service Role Key if it's hidden again, just to be safe for the local run
    // (copying logic from manual-cron-run)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // ... simplistic check
        const jwtRegex = /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/;
        for (const [key, val] of Object.entries(process.env)) {
            if (typeof val === 'string' && val.includes('service_role') && jwtRegex.test(val)) {
                process.env.SUPABASE_SERVICE_ROLE_KEY = val.match(jwtRegex)![0];
                console.log('Found key in', key);
            }
        }
    }

    try {
        const { getVegasStripItems } = await import('../lib/vegas-strip/feed-integration');

        console.log('Calling getVegasStripItems(10)...');
        const items = await getVegasStripItems(10);

        console.log(`Examples found: ${items.length}`);
        if (items.length > 0) {
            console.log('First item:', JSON.stringify(items[0], null, 2));
        } else {
            // Debug why empty
            const { supabaseAdmin } = await import('../lib/supabase-admin');
            const { count, error } = await supabaseAdmin
                .from('scraped_items')
                .select('*', { count: 'exact', head: true });

            console.log('Total rows in scraped_items:', count);
            if (error) console.error('DB Error:', error);
        }

    } catch (e: any) {
        console.error('Crash:', e);
    }
}

debugFeed();
