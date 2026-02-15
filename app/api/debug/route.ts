// app/api/debug/route.ts
// Herramienta de diagnÃ³stico para verificar el estado real de la plataforma

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getLatestRuns } from '@/lib/apify';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
    const startTime = Date.now();

    try {
        // 1. Verificar conexiÃ³n con Supabase
        const { data: content, count, error: dbError } = await supabase
            .from('content')
            .select('id, title, created_at, category', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5);

        if (dbError) throw dbError;

        // 2. Verificar sesiÃ³n de usuario
        const { data: { session } } = await supabase.auth.getSession();

        // 3. Verificar estado de Apify (Scrapers)
        let apifyStatus: { status: string; details: string; recent_runs?: any[] } = { status: 'unknown', details: 'No token configured' };
        if (process.env.APIFY_TOKEN && process.env.APIFY_ACTOR_WATCHER) {
            try {
                const runs = await getLatestRuns(process.env.APIFY_ACTOR_WATCHER, 3);
                // Handle both array (empty) and PaginatedList cases
                const items = Array.isArray(runs) ? runs : (runs?.items || []);
                apifyStatus = {
                    status: 'connected',
                    details: `${items.length} recent runs found`,
                    recent_runs: items.map((run: any) => ({
                        status: run.status,
                        started_at: run.startedAt,
                        finished_at: run.finishedAt,
                        url: `https://console.apify.com/actors/${run.actId}/runs/${run.id}`
                    }))
                };
            } catch (apifyError: any) {
                apifyStatus = { status: 'error', details: apifyError.message };
            }
        }

        const latestItem = content && content.length > 0 ? content[0] : null;

        const results = {
            status: 'success',
            timestamp: new Date().toISOString(),
            database: {
                total_items: count || 0,
                connection: 'established',
                latest_items: content,
                last_item_added: latestItem ? latestItem.created_at : 'none'
            },
            scrapers: apifyStatus,
            auth: {
                is_logged_in: !!session,
                user_email: session?.user?.email || 'anonymous'
            },
            environment: {
                node_version: process.version,
                vercel_region: process.env.VERCEL_REGION || 'local',
                has_cron_secret: !!process.env.CRON_SECRET,
                has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                has_apify_token: !!process.env.APIFY_TOKEN
            },
            duration: `${Date.now() - startTime}ms`
        };

        return NextResponse.json(results);

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}




