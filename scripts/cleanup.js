const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// SCRIPT DE LIMPIEZA DIARIA (VENUZ HYGIENE PROTOCOL)
// Lógica:
// 1. Soft Delete: Eventos temporales viejos (>7 días) -> active = false
// 2. Archive: Eventos muy viejos (>90 días) -> mover a tabla archive
// 3. Purge: Basura (>2 años, bajo engagement) -> delete forever

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
    console.log('🧹 [Cleanup] Starting daily hygiene protocol...');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const sevenDaysAgo = new Date(now - 7 * dayMs).toISOString();
    const ninetyDaysAgo = new Date(now - 90 * dayMs).toISOString();
    const twoYearsAgo = new Date(now - 730 * dayMs).toISOString();

    try {
        // 1. SOFT DELETE (Solo eventos temporales)
        const { data: soft, error: err1 } = await supabase
            .from('content')
            .update({ active: false })
            .lt('event_date', sevenDaysAgo) // Si usan event_date
            // O fallback a scraped_at si event_date es null
            .or(`event_date.is.null,event_date.lt.${sevenDaysAgo}`)
            .lt('scraped_at', sevenDaysAgo)
            .eq('active', true)
            .eq('is_permanent', false)
            .select('id');

        if (err1) console.error('   ❌ Soft delete error:', err1.message);
        else console.log(`   📉 Soft deleted: ${soft?.length || 0} temporary events.`);

        // 2. ARCHIVE (Mover a histórico)
        // Usamos la RPC function creada en migración 002
        const { error: err2 } = await supabase.rpc('archive_old_content', {
            cutoff: ninetyDaysAgo
        });

        if (err2) {
            console.error('   ❌ Archive RPC error:', err2.message);
        } else {
            console.log('   📦 Archived events older than 90 days.');
        }

        // 3. PURGE (Borrado físico de basura)
        // Solo borramos si el engagement es muy bajo (views < 50)
        const { data: purged, error: err3 } = await supabase
            .from('content')
            .delete()
            .lt('scraped_at', twoYearsAgo)
            .lt('views_count', 50)
            .select('id');

        if (err3) console.error('   ❌ Purge error:', err3.message);
        else console.log(`   🗑️ Purged ${purged?.length || 0} ancient items with low engagement.`);

    } catch (error) {
        console.error('CRITICAL CLEANUP FAILURE:', error);
    }

    console.log('✨ [Cleanup] Finished.');
}

cleanup();
