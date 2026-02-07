// app/api/push/send/route.ts
// Endpoint para enviar notificaciones push (usado por crons)

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Fallback credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR';

// Configurar VAPID keys (solo si están disponibles)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:admin@venuz.app',
        vapidPublicKey,
        vapidPrivateKey
    );
}

function getSupabase(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: NextRequest) {
    // Verificar autorización
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, body, url, icon, userIds } = await req.json();

        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body required' }, { status: 400 });
        }

        // Obtener suscripciones
        const supabase = getSupabase();
        let query = supabase.from('push_subscriptions').select('*');

        // Si hay userIds específicos, filtrar
        if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds);
        }

        const { data: subscriptions, error } = await query;

        if (error) {
            console.error('[Push Send] Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                message: 'No subscribers found'
            });
        }

        // Payload de la notificación
        const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            url: url || '/',
            timestamp: Date.now(),
        });

        // Enviar a todos los suscriptores
        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                try {
                    await webpush.sendNotification(sub.subscription, payload);
                    return { success: true, endpoint: sub.endpoint };
                } catch (err: any) {
                    // Si el endpoint ya no es válido, eliminarlo
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint);
                    }
                    return { success: false, endpoint: sub.endpoint, error: err.message };
                }
            })
        );

        const successful = results.filter((r: any) => r.status === 'fulfilled' && r.value?.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            success: true,
            sent: successful,
            failed,
            total: subscriptions.length,
        });

    } catch (error: any) {
        console.error('[Push Send] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
