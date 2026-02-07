// app/api/analytics/conversions/route.ts
// Tracking de conversiones de afiliados

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: NextRequest) {
    try {
        const {
            contentId,
            userId,
            affiliateSource,
            eventType = 'click'
        } = await req.json();

        if (!contentId) {
            return NextResponse.json({ error: 'contentId required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Insertar evento de conversión
        const { error } = await supabase
            .from('affiliate_conversions')
            .insert({
                content_id: contentId,
                user_id: userId || null,
                affiliate_source: affiliateSource || 'unknown',
                event_type: eventType, // click, signup, purchase
                user_agent: req.headers.get('user-agent') || '',
                ip_hash: hashIP(req.headers.get('x-forwarded-for') || ''),
            });

        if (error) {
            console.error('[Conversions] Insert error:', error);
            // No fallar - tabla podría no existir
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Conversions] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Estadísticas de conversiones
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabase();

        // Obtener últimas 7 días de conversiones
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: conversions, error } = await supabase
            .from('affiliate_conversions')
            .select('affiliate_source, event_type, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({
                error: 'Stats not available',
                message: 'Run SQL migration to create affiliate_conversions table'
            }, { status: 200 });
        }

        // Agrupar por fuente
        const bySource: Record<string, { clicks: number, signups: number, purchases: number }> = {};

        (conversions || []).forEach((c: any) => {
            const source = c.affiliate_source || 'unknown';
            if (!bySource[source]) {
                bySource[source] = { clicks: 0, signups: 0, purchases: 0 };
            }
            if (c.event_type === 'click') bySource[source].clicks++;
            if (c.event_type === 'signup') bySource[source].signups++;
            if (c.event_type === 'purchase') bySource[source].purchases++;
        });

        // Agrupar por día
        const byDay: Record<string, number> = {};
        (conversions || []).forEach((c: any) => {
            const day = c.created_at.split('T')[0];
            byDay[day] = (byDay[day] || 0) + 1;
        });

        return NextResponse.json({
            success: true,
            totalConversions: conversions?.length || 0,
            bySource,
            byDay,
            period: '7_days',
        });

    } catch (error: any) {
        console.error('[Conversions] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Hash IP for privacy
function hashIP(ip: string): string {
    if (!ip) return '';
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
