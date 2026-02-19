
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load env
const envLoc = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLoc });
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function debugFeed() {
    console.log('🚀 Checking DB Content...');

    // Need to extract Service Role Key if it's hidden again
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const jwtRegex = /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/;
        for (const [key, val] of Object.entries(process.env)) {
            if (typeof val === 'string' && val.includes('service_role') && jwtRegex.test(val)) {
                process.env.SUPABASE_SERVICE_ROLE_KEY = val.match(jwtRegex)![0];
            }
        }
    }

    try {
        const { supabaseAdmin } = await import('../lib/supabase-admin');

        // Check count
        const { count, error: countError } = await supabaseAdmin
            .from('scraped_items')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Total items in 'scraped_items': ${count}`);

        // Check recent items
        const { data: recent, error } = await supabaseAdmin
            .from('scraped_items')
            .select('title, category, is_published, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recent) {
            console.log('\nLast 5 items added:');
            recent.forEach(i => console.log(`- [${i.category}] ${i.title} (Published: ${i.is_published})`));
        }

    } catch (e: any) {
        console.error('Crash:', e);
    }
}

debugFeed();
