
const { createClient } = require('@supabase/supabase-js');

const url = "https://jbrmziwosyeructvlvrq.supabase.co";
const key1 = "sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR"; // The one from .env.local
const key2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk2ODg0MSwiZXhwIjoyMDgyNTQ0ODQxfQ.O20L2R8qZmZ9Cm41rs4FVNCpROQXC9oLO731DlHMZkA"; // The service role from .env

async function test(name, key) {
    console.log(`Testing key: ${name}...`);
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('content').select('id').limit(1);
        if (error) {
            console.error(`  - Failed: ${error.message}`);
        } else {
            console.log(`  - Success! Found ${data.length} items.`);
        }
    } catch (e) {
        console.error(`  - Error: ${e.message}`);
    }
}

async function run() {
    await test("Env Local Link Key", key1);
    await test("Service Role Key", key2);
}

run();
