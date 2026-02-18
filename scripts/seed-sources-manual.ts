import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv(filePath: string) {
    if (!fs.existsSync(filePath)) return {};
    return fs.readFileSync(filePath, 'utf-8').split('\n').reduce((acc, line) => {
        const [key, val] = line.split('=');
        if (key && val) acc[key.trim()] = val.trim();
        return acc;
    }, {} as Record<string, string>);
}

const env = {
    ...loadEnv('.env'),
    ...loadEnv('.env.local')
};

// @ts-ignore
const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

async function seedSources() {
    console.log('🌱 Manually Seeding Sources...');

    // 1. Candy.ai (ES)
    const { error: err1 } = await supabase
        .from('scraping_sources')
        .upsert({
            name: 'Candy.ai (ES)',
            base_url: 'https://candy.ai/es',
            category: 'ai_companion',
            is_active: true,
            scraping_config: {
                cardSelector: 'article, .model-card, .character-card'
            }
        }, { onConflict: 'base_url' });

    if (err1) console.error('❌ Insert Error:', err1.message);
    else console.log('✅ Inserted Candy.ai source');
}

seedSources();
