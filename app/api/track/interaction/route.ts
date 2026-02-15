import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { content_id, action, value = 1 } = await req.json();
        const heads = await headers();
        let session_id = heads.get('x-venu-session') || heads.get('cookie')?.match(/venu_session_id=([^;]+)/)?.[1];

        // Si no hay sesión, crear una nueva (simple ID generation)
        let newCookie = null;
        if (!session_id) {
            session_id = crypto.randomUUID();
            newCookie = `venu_session_id=${session_id}; Path=/; HttpOnly; Max-Age=2592000`;
        }

        if (!content_id || !action) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Insertar señal del usuario en user_signals (tabla nueva) o user_engagement (tabla existente)
        // El prompt dice "anonymous_interactions" pero en DB migration tenemos "user_engagement" y "user_signals" (en futuro).
        // Usaré "user_signals" como pide el prompt "CÓDIGO 6: FeedBrain SCE".
        // Si la tabla no existe, fallará, así que aseguraré crear la migración primero.

        // Primero intentamos endpoint standard
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_signals`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                session_id,
                content_id,
                signal_type: action, // mapping keys
                value,
            }),
        });

        if (!res.ok) {
            // Fallback a user_engagement (tabla vieja) si user_signals no existe
            const res2 = await fetch(`${SUPABASE_URL}/rest/v1/user_engagement`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    device_id: session_id, // mapping to device_id
                    action: action,
                    // category_slug?? No available here easily
                })
            });

            if (!res2.ok) throw new Error('DB insert failed');
        }

        const response = NextResponse.json({ success: true });
        if (newCookie) {
            response.headers.set('Set-Cookie', newCookie);
        }

        return response;
    } catch (error) {
        console.error('Track interaction error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
