const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first
require('dotenv').config(); // Fallback

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Credentials missing. Ensure .env has NEXT_PUBLIC_SUPABASE_URL and key.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log("🕵️ Verifying Database Schema for VENUZ V2...");

    // Try to select the new columns
    const { data, error } = await supabase
        .from('content')
        .select('id, title, video_url, thumbnail_url, affiliate_url, is_premium')
        .limit(1);

    if (error) {
        console.error("\n❌ Schema Check Failed!");
        console.error("Error details:", error.message);
        console.error("\nPossible Cause: The SQL migration has NOT been run yet.");
        console.error("Action Required: Run the SQL in 'supabase/migrations/20260122_add_content_fields.sql' in your Supabase Dashboard.");
    } else {
        console.log("\n✅ Schema Check Passed!");
        console.log("The 'content' table has the required V2 columns.");
        console.log(`Sample row retrieved: ${data.length > 0 ? 'Yes' : 'No rows yet'}`);
    }
}

verifySchema();
