import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'edge';

async function logHealth(level: 'info' | 'warning' | 'error', message: string, data?: any) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/system_logs`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ level, message, data }),
        });
    } catch (err) {
        console.error('Failed to log health:', err);
    }
}

export async function GET() {
    try {
        // 1. Check Supabase Connectivity
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/content?limit=1`, {
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
            },
        });

        if (!dbRes.ok) throw new Error(`Supabase disconnected (Status: ${dbRes.status})`);

        // 2. Check Scraper Health (últimos items ingresados hoy)
        const today = new Date().toISOString().split('T')[0];
        const scrapeRes = await fetch(`${SUPABASE_URL}/rest/v1/pending_events?select=count&created_at=gte.${today}`, {
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
                'Range': '0-0'
            },
        });

        // Obtener count del header Content-Range (ej: 0-0/42 -> 42 items)
        const range = scrapeRes.headers.get('Content-Range');
        const scrapeCount = range ? parseInt(range.split('/')[1] || '0') : 0;

        // 3. Check External Sources Health
        const sourcesRes = await fetch(`${SUPABASE_URL}/rest/v1/external_event_sources?select=source_name,failure_count,is_active`, {
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
            },
        });
        const sources = sourcesRes.ok ? await sourcesRes.json() : [];
        const failedSources = sources.filter((s: any) => s.failure_count > 3 && s.is_active);

        // Logging Result
        const status = failedSources.length > 0 ? 'warning' : 'healthy';

        await logHealth(status === 'healthy' ? 'info' : 'warning', `Health check: ${status.toUpperCase()}`, {
            scrape_today: scrapeCount,
            failed_sources: failedSources.map((s: any) => s.source_name)
        });

        // Alertar si hay fuentes fallando continuamente
        if (failedSources.length > 0) {
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_ID) {
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: process.env.TELEGRAM_OWNER_ID,
                        text: `⚠️ VENUZ WARNING: Fuentes fallando: ${failedSources.map((s: any) => s.source_name).join(', ')}`,
                    }),
                }).catch(console.error);
            }
        }

        return NextResponse.json({
            status,
            scrape_today: scrapeCount,
            sources_status: sources
        });

    } catch (error: any) {
        await logHealth('error', 'Health check FAILED', { error: error.message });

        // Alert Telegram CRITICAL
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_ID) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_OWNER_ID,
                    text: `🚨 VENUZ CRITICAL: ${error.message}`,
                }),
            }).catch(console.error);
        }

        return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 });
    }
}
