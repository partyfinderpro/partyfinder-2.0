import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

/**
 * /api/affiliate/activate
 *
 * Activa una regla de afiliado para un dominio dado.
 * Una vez activo, el LinkTransformer inyecta automáticamente el ID
 * en TODOS los links de ese dominio que se generen de ahora en adelante.
 *
 * Pablo lo llama desde Telegram con el comando:
 *   /activar candy.ai pv123
 *
 * O con un GET manual:
 *   POST /api/affiliate/activate { domain: 'candy.ai', affiliate_id: 'pv123' }
 */
export async function POST(req: NextRequest) {
    // Seguridad básica — requiere token secreto (el mismo CRON_SECRET si lo tienes)
    const auth = req.headers.get('authorization') || '';
    const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (secret && auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, affiliate_id, template_url } = await req.json();

    if (!domain || !affiliate_id) {
        return NextResponse.json({ error: 'domain y affiliate_id son requeridos' }, { status: 400 });
    }

    // 1. Upsert la regla de afiliado
    const { error: ruleError } = await supabase
        .from('affiliate_rules')
        .upsert({
            domain: domain.toLowerCase().replace('www.', ''),
            affiliate_id,
            template_url: template_url ?? `https://${domain}/?ref={aff_id}`,
            is_active: true,
        }, { onConflict: 'domain' });

    if (ruleError) {
        return NextResponse.json({ error: ruleError.message }, { status: 500 });
    }

    // 2. Actualizar todos los scraped_items de ese dominio para que usen el nuevo link
    const domainPattern = `%${domain}%`;
    const { data: items, error: itemsError } = await supabase
        .from('scraped_items')
        .select('id, original_url')
        .like('original_url', domainPattern);

    if (!itemsError && items && items.length > 0) {
        // Regenerar affiliate_url para cada item existente
        const updates = items.map(item => {
            const sep = item.original_url.includes('?') ? '&' : '?';
            const affUrl = `${item.original_url}${sep}ref=${affiliate_id}`;
            return supabase
                .from('scraped_items')
                .update({ affiliate_url: affUrl })
                .eq('id', item.id);
        });

        await Promise.allSettled(updates);
    }

    // 3. Notificar por Telegram
    const report = [
        `✅ *Afiliado activado*`,
        ``,
        `🌐 Dominio: \`${domain}\``,
        `🆔 ID: \`${affiliate_id}\``,
        `🔗 Items actualizados: ${items?.length ?? 0}`,
        ``,
        `De ahora en adelante todos los links de este sitio`,
        `llevarán tu ID de afiliado automáticamente. 💰`,
    ].join('\n');

    // Enviar reporte admin (fire and forget)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_OWNER_ID;
    if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: report, parse_mode: 'Markdown' }),
        }).catch(() => null);
    }

    return NextResponse.json({
        success: true,
        domain,
        affiliate_id,
        items_updated: items?.length ?? 0,
    });
}

/**
 * GET — Ver estado de todas las reglas de afiliado
 */
export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization') || '';
    const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (secret && auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rules, error } = await supabase
        .from('affiliate_rules')
        .select('domain, affiliate_id, is_active, created_at')
        .order('is_active', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const active = rules?.filter(r => r.is_active) ?? [];
    const pending = rules?.filter(r => !r.is_active) ?? [];

    return NextResponse.json({
        success: true,
        summary: `${active.length} activos, ${pending.length} pendientes`,
        active,
        pending,
    });
}
