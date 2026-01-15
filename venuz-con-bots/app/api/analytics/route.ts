import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Registrar evento
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_type, content_id, user_id, metadata } = body;

        if (!event_type) {
            return NextResponse.json({ error: 'event_type es requerido' }, { status: 400 });
        }

        const { error } = await supabase
            .from('analytics_events')
            .insert({
                event_type,
                content_id: content_id || null,
                user_id: user_id || null,
                metadata: metadata || {}
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error logging analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Obtener stats
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .rpc('get_analytics_stats', {
                p_start_date: startDate.toISOString(),
                p_end_date: new Date().toISOString()
            });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
