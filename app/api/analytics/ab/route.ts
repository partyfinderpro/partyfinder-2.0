// app/api/analytics/ab/route.ts
// Endpoint para recibir eventos de A/B Testing

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

interface ABEvent {
    variant: string;
    userId: string;
    timestamp: number;
    event: string;
    data?: Record<string, any>;
}

export async function POST(req: NextRequest) {
    try {
        const { events } = await req.json() as { events: ABEvent[] };

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Events array required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Insertar eventos en lote
        const records = events.map(event => ({
            variant: event.variant,
            user_id: event.userId,
            event_type: event.event,
            event_data: event.data || {},
            created_at: new Date(event.timestamp).toISOString(),
        }));

        const { error } = await supabase
            .from('ab_analytics')
            .insert(records);

        if (error) {
            console.error('[AB Analytics] Insert error:', error);
            // No fallar - la tabla podría no existir todavía
        }

        return NextResponse.json({
            success: true,
            received: events.length
        });

    } catch (error: any) {
        console.error('[AB Analytics] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Obtener estadísticas de A/B testing
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabase();

        // Obtener conteo por variante
        const { data: variantCounts, error: countError } = await supabase
            .from('ab_analytics')
            .select('variant, event_type')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (countError) {
            return NextResponse.json({
                error: 'Stats not available yet',
                message: 'Run the SQL migration to create ab_analytics table'
            }, { status: 200 });
        }

        // Calcular estadísticas
        const stats = {
            control: { assignments: 0, likes: 0, conversions: 0 },
            A: { assignments: 0, likes: 0, conversions: 0 },
            B: { assignments: 0, likes: 0, conversions: 0 },
            C: { assignments: 0, likes: 0, conversions: 0 },
        };

        (variantCounts || []).forEach((event: any) => {
            const v = event.variant as keyof typeof stats;
            if (stats[v]) {
                if (event.event_type === 'assignment') stats[v].assignments++;
                if (event.event_type === 'like') stats[v].likes++;
                if (event.event_type === 'conversion') stats[v].conversions++;
            }
        });

        return NextResponse.json({
            success: true,
            totalEvents: variantCounts?.length || 0,
            stats,
        });

    } catch (error: any) {
        console.error('[AB Analytics] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
