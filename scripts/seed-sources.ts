import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

async function seedSources() {
    console.log('🌱 Seeding Scraping Sources...');

    const sources = [
        {
            name: 'Candy.ai (ES)',
            base_url: 'https://candy.ai/es',
            category: 'ai_companion',
            is_active: true,
            scraping_config: {
                cardSelector: '.model-card, .character-card, a[href^="/character/"]' // Ajustar según lo que vimos en el test
            }
        }
    ];

    for (const source of sources) {
        const { error } = await supabase
            .from('scraping_sources')
            .upsert(source, { onConflict: 'base_url' });

        if (error) {
            console.error('❌ Error inserting:', source.name, error.message);
        } else {
            console.log('✅ Inserted:', source.name);
        }
    }
}

seedSources();
