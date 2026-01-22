
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Connection to:", supabaseUrl);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('regions').select('*').limit(1);

        if (error) {
            console.error("❌ Supabase Error:", error.message);
            console.error("Full Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Connection Successful!");
            console.log("Data received:", data);
            if (data.length === 0) {
                console.log("⚠️ Table 'regions' exists but is empty.");
            }
        }
    } catch (err) {
        console.error("❌ Unexpected Error:", err.message);
        if (err.cause) console.error("Cause:", err.cause);
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);
testConnection();
