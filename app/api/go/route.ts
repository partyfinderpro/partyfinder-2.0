import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente con Service Role para poder escribir en conversiones
// y leer links activos sin restricciones de RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    console.error("❌ FATAL: Missing SUPABASE_SERVICE_ROLE_KEY for tracking.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: { persistSession: false }
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    // Validación básica
    if (!linkId) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        // 1. Obtener el link original
        const { data: link, error: fetchError } = await supabase
            .from('affiliate_links')
            .select('affiliate_url, is_active')
            .eq('id', linkId)
            .single();

        if (fetchError || !link) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        if (!link.is_active) {
            return NextResponse.json({ error: 'Link is waiting for activation' }, { status: 410 });
        }

        // 2. Registrar el click (fire & forget para no bloquear)
        // No usamos 'await' bloqueante para la inserción, pero sí capturamos errores
        const clickData = {
            link_id: linkId,
            clicked_at: new Date().toISOString(),
            user_agent: request.headers.get('user-agent') || 'unknown',
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            metadata: {
                referer: request.headers.get('referer') || null,
                country: request.geo?.country || null,
                city: request.geo?.city || null
            }
        };

        // Ejecutamos la inserción en segundo plano (Serverless permite esto parcialmente,
        // en Edge sería waitUntil). En Node runtime, es mejor hacer await rápido.
        await supabase.from('affiliate_conversions').insert(clickData);

        // 3. Incrementar contador simple (opcional, para dashboard rápido)
        const { error: rpcError } = await supabase.rpc('increment_affiliate_clicks', { row_id: linkId });

        if (rpcError) {
            // Fallback o simplemente ignorar error de stats para no bloquear la redirección
            console.warn("Error incrementing clicks:", rpcError);
        }

        // 4. Redirección final (307 Temporary Redirect para no cachear el destino permanente)
        // Usamos 302/307 para que el navegador siempre pase por aquí y trackee.
        return NextResponse.redirect(link.affiliate_url, 307);

    } catch (err) {
        console.error('Tracking Error:', err);
        // En caso de error crítico, intentamos redirigir al home como fallback
        return NextResponse.redirect(new URL('/', request.url));
    }
}

// Configuración opcional: Edge Runtime para menor latencia (opcional)
// export const runtime = 'edge';
// Nota: Dejamos Node.js por defecto para compatibilidad máxima con librerías la primera vez.
