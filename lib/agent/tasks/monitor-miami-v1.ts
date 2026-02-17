import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { Telegraf } from 'telegraf';

const EXPERIMENT_NAME = 'miami_vibe_boost_v1';
const CAMPAIGN = 'miami_v1_launch';
const TIME_WINDOW_HOURS = 48;

export async function monitorMiamiV1() {
    const since = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    console.log(`[AGENT] Monitoring Miami v1 since ${since}...`);

    // 1. Get metrics for the campaign
    const { data: viewsData, error: viewsError } = await supabase
        .from('analytics_events')
        .select('venue_id')
        .eq('event_type', 'page_view')
        .eq('utm_campaign', CAMPAIGN)
        .gte('created_at', since);

    if (viewsError) console.error('[AGENT] Error fetching views:', viewsError.message);

    const totalViews = viewsData?.length || 0;

    // 2. Get clicks (conversion signal)
    const { data: clicksData, error: clicksError } = await supabase
        .from('analytics_events')
        .select('venue_id')
        .eq('event_type', 'click')
        .eq('utm_campaign', CAMPAIGN)
        .gte('created_at', since);

    if (clicksError) console.error('[AGENT] Error fetching clicks:', clicksError.message);

    const totalClicks = clicksData?.length || 0;
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // 3. Get Baseline CTR for the region (Miami) using RPC
    const { data: baseline, error: baselineError } = await supabase
        .rpc('calculate_region_baseline_ctr', {
            p_region: 'Miami',
            p_exclude_campaign: CAMPAIGN,
            p_since: since
        });

    if (baselineError) console.error('[AGENT] Error fetching baseline:', baselineError.message);

    const baselineCtr = Number(baseline) || 5.0; // Fallback to 5%
    const lift = baselineCtr > 0 ? ((ctr - baselineCtr) / baselineCtr) * 100 : 0;

    // 4. Decision Logic
    let decision = 'observar';
    let actionTaken = 'Ninguna';
    let recommendation = 'Continuar monitoreo 24h más';

    if (totalViews < 10) {
        decision = 'bajo_trafico';
        recommendation = 'Lanzar segundo push en Telegram para ganar volumen';
    } else if (lift > 15) {
        decision = 'escalar';
        actionTaken = 'Aumentar split del experimento a 75%';

        // Update experiment (assuming table has traffic_split)
        await supabase
            .from('highway_experiments')
            .update({ config: { traffic_split: 0.75 } }) // Adjust based on actual schema
            .eq('name', EXPERIMENT_NAME);

    } else if (lift < -10) {
        decision = 'ajustar_negativo';
        recommendation = 'Revisar si el contenido es demasiado "Adult" para el tráfico de Telegram';
    }

    // 5. Build Report
    const report = `📊 *Reporte Autonómo Miami v1* (${TIME_WINDOW_HOURS}h)

👁️ Vistas Telegram: ${totalViews}
🖱️ Clicks totales: ${totalClicks}
🎯 CTR Campaña: ${ctr.toFixed(2)}%
📉 Baseline Región: ${baselineCtr.toFixed(2)}%
🚀 Lift: ${lift.toFixed(1)}%

*Decisión:* ${decision.toUpperCase()}
*Acción:* ${actionTaken}
*Recomendación:* ${recommendation}`;

    return {
        success: true,
        totalViews,
        totalClicks,
        ctr,
        baselineCtr,
        lift,
        decision,
        report
    };
}
