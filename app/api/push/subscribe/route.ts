// app/api/push/subscribe/route.ts
// Endpoint para guardar suscripciones push

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const subscription = await req.json();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookies().get(name)?.value } }
        );

        const { data: { user } } = await supabase.auth.getUser();

        // Guardar subscription (con o sin usuario)
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user?.id || null,
                endpoint: subscription.endpoint,
                subscription: subscription,
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('[Push Subscribe] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Push Subscribe] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
