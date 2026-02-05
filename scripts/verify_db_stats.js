require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyStats() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 [DATABASE VERIFICATION]');

    const { data: stats, error } = await supabase
        .from('content')
        .select('category, location')
        .eq('active', true);

    if (error) {
        console.error('❌ Error fetching stats:', error.message);
        return;
    }

    const summary = {};
    stats.forEach(item => {
        const cat = item.category || 'sin-categoria';
        summary[cat] = (summary[cat] || 0) + 1;
    });

    console.log('\n--- RESUMEN POR CATEGORÍA ---');
    Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`${cat.padEnd(15)}: ${count} registros`);
    });

    const citySummary = {};
    stats.forEach(item => {
        const loc = item.location || 'Global';
        citySummary[loc] = (citySummary[loc] || 0) + 1;
    });

    console.log('\n--- RESUMEN POR CIUDAD (Top) ---');
    Object.entries(citySummary)
        .filter(([loc, count]) => count > 5)
        .sort((a, b) => b[1] - a[1])
        .forEach(([loc, count]) => {
            console.log(`${loc.padEnd(15)}: ${count} registros`);
        });

    console.log(`\nTOTAL DE REGISTROS ACTIVOS: ${stats.length}`);
}



verifyStats();
