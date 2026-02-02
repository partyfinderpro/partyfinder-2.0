const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Error: SUPABASE_SERVICE_ROLE_KEY missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeJunk() {
    console.log("🧹 VENUZ PURGE PROTOCOL INITIATED (with Admin Key)...");

    const junkPatterns = [
        '%theporndude%',
        '%porngeek%',
        '%porn dude%',
        '%porn sites%',
        '%sex cams%'
    ];

    let totalDeleted = 0;

    for (const pattern of junkPatterns) {
        // Delete by source_url
        const { count: countUrl, error: errorUrl } = await supabase
            .from('content')
            .delete({ count: 'exact' })
            .ilike('source_url', pattern);

        if (errorUrl) console.error(`Error deleting URL pattern ${pattern}:`, errorUrl.message);
        else if (countUrl > 0) {
            console.log(`- Deleted ${countUrl} items matching URL pattern: ${pattern}`);
            totalDeleted += countUrl;
        }

        // Delete by title
        const { count: countTitle, error: errorTitle } = await supabase
            .from('content')
            .delete({ count: 'exact' })
            .ilike('title', pattern);

        if (errorTitle) console.error(`Error deleting Title pattern ${pattern}:`, errorTitle.message);
        else if (countTitle > 0) {
            console.log(`- Deleted ${countTitle} items matching Title pattern: ${pattern}`);
            totalDeleted += countTitle;
        }
    }

    console.log(`\n✨ PURGE COMPLETE. Total items sent to oblivion: ${totalDeleted}`);
}

purgeJunk();
