import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Obtener estadísticas rápidas
        const { count: totalActive } = await supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        const { data: stats } = await supabase
            .from('content')
            .select('category, active')
            .eq('active', true);

        const categoryBreakdown = stats?.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {}) || {};

        return NextResponse.json({
            status: 'healthy',
            database: 'connected',
            total_active_content: totalActive,
            breakdown: categoryBreakdown,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 });
    }
}
