const { createClient } = require('@supabase/supabase-js');

// Hardcoded from .env.local view (to test if this specific key works)
const SUPABASE_URL = "https://jbrmziwosyeructvlvrq.supabase.co";
// NOTE: This key looks suspicious (short). Standard keys are JWTs.
const SUPABASE_ANON_KEY = "sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
    console.log("Testing Supabase Connection & RLS...");
    console.log(`URL: ${SUPABASE_URL}`);
    console.log(`Key: ${SUPABASE_ANON_KEY} (Format check: ${SUPABASE_ANON_KEY.startsWith('ey') ? 'Looks like JWT' : 'DOES NOT look like JWT'})`);

    const { data, error } = await supabase
        .from('content')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Connection Failed:", error.message);
        if (error.message.includes("JWT")) {
            console.error("🚨 DIAGNOSIS: The ANON KEY in .env.local is invalid. It should be a JWT (start with 'ey...').");
        }
    } else {
        console.log(`✅ Connection Successful! Found ${data === null ? 'unknown' : 'accessible'} rows (Head request).`);
        // Try to actually read one
        const { data: rows, error: readError } = await supabase.from('content').select('*').limit(1);
        if (readError) {
            console.error("❌ Read Failed (RLS likely):", readError.message);
        } else {
            console.log(`✅ Read Successful! Retrieved ${rows.length} rows.`);
        }
    }
}

checkConnection();
