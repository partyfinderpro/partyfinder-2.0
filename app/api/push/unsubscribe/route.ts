// app/api/push/unsubscribe/route.ts
// Endpoint para cancelar suscripción push

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fallback credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR';

function getSupabase() {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: NextRequest) {
    try {
        const { endpoint } = await req.json();

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
        }

        // Eliminar la suscripción de la base de datos
        const supabase = getSupabase();
        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);

        if (error) {
            console.error('[Push Unsubscribe] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Push Unsubscribe] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
