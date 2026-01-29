
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecs() {
    console.log('Testing Recommendations Algorithm...');

    // Step 1: Fetch content base
    const { data: allContent, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('Error fetching content:', error);
        return;
    }

    console.log(`Fetched ${allContent?.length || 0} items from content table.`);

    if (!allContent || allContent.length === 0) {
        console.log('NO CONTENT IN DATABASE!');
        return;
    }

    // Sort by a mock score
    const scoredContent = allContent.map(item => {
        let score = (item.likes || 0) * 2 + (item.views || 0) * 0.5 + Math.random() * 15;
        return { ...item, score };
    });

    const result = scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    console.log(`Algorithm would return ${result.length} items.`);
    if (result.length > 0) {
        console.log('First item:', result[0].title);
    }
}

testRecs();
