
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Loaded from env
const key2 = process.env.SUPABASE_SERVICE_ROLE_KEY; // Loaded from env

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
