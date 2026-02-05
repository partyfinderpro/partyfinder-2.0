import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Resetear trending_score
        await supabase.from('content').update({ trending_score: 0 }).neq('trending_score', 0);

        // 2. Calcular trending basado en engagement reciente
        // Agrupamos engagement por item_id en las últimas 24h
        const { data: popularItems, error: engagementError } = await supabase
            .from('user_engagement')
            .select('item_id')
            .gte('created_at', twentyFourHoursAgo);

        if (engagementError) throw engagementError;

        if (popularItems && popularItems.length > 0) {
            const counts: Record<string, number> = {};
            popularItems.forEach(item => {
                counts[item.item_id] = (counts[item.item_id] || 0) + 1;
            });

            // 3. Actualizar trending_score en la tabla content
            for (const [itemId, count] of Object.entries(counts)) {
                await supabase
                    .from('content')
                    .update({ trending_score: count })
                    .eq('id', itemId);
            }
        }

        return NextResponse.json({ success: true, updated: popularItems?.length || 0 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
