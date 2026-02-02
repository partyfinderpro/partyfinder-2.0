const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectContent() {
    console.log("🔍 INSPECTING CONTENT SAMPLE...");

    const { data, error } = await supabase
        .from('content')
        .select('id, title, source_url, image_url, category')
        .limit(20)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching content:", error.message);
        return;
    }

    console.log("Found " + data.length + " items:");
    data.forEach(item => {
        console.log(`- [${item.category}] ${item.title} (Source: ${item.source_url})`);
        if (item.image_url) console.log(`  Img: ${item.image_url.substring(0, 50)}...`);
    });
}

inspectContent();
