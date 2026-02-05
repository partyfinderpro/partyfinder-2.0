require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixCategories() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🛠️ [DATABASE FIX] Actualizando categorías...');

    // 1. Rename escort -> soltero
    const { data: updated, error } = await supabase
        .from('content')
        .update({ category: 'soltero' })
        .eq('category', 'escort')
        .select();

    if (error) {
        console.error('❌ Error updating categories:', error.message);
    } else {
        console.log(`✅ +${updated?.length || 0} registros actualizados de 'escort' a 'soltero'.`);
    }

    // 2. Ensure all 'event' are 'evento' (normalization)
    const { data: updatedEvents, error: eventError } = await supabase
        .from('content')
        .update({ category: 'evento' })
        .eq('category', 'event')
        .select();

    if (eventError) {
        console.error('❌ Error normalizing events:', eventError.message);
    } else {
        console.log(`✅ +${updatedEvents?.length || 0} registros normalizados de 'event' a 'evento'.`);
    }
}

fixCategories();
