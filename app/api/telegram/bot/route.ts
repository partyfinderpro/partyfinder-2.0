// app/api/telegram/bot/route.ts
// Reemplaza o extiende el webhook existente para incluir comandos de Growth

import { Telegraf } from 'telegraf';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Comandos básicos
bot.start((ctx) => {
    ctx.reply(
        `🔥 *Bienvenido al Club Secreto de VENUZ* 🔥\n\n` +
        `Aquí recibes las mejores recomendaciones de fiesta y planes exclusivos.\n\n` +
        `Comandos:\n` +
        `/top - Top 3 venues probados hoy\n` +
        `/fiesta - Dónde está el ambiente ahora\n` +
        `/premium - Acceso VIP y descuentos`,
        { parse_mode: 'Markdown' }
    );

    // Registrar usuario en BD (Lead capture)
    const user = ctx.from;
    if (user) {
        supabase.from('telegram_users').upsert({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_interaction: new Date()
        }).then(({ error }) => {
            if (error) console.error('Error saving telegram user:', error);
        });
    }
});

bot.command('top', async (ctx) => {
    // Simulación de recomendación inteligente (Highway)
    // En real: consultaríamos a la API interna de Highway
    ctx.replyWithMarkdown(
        `🏆 *Top 3 Venues para Hoy*\n\n` +
        `1. 🍸 *La Santa* - Ambiente: 9.8/10\n` +
        `   [Reservar Mesa VIP](https://venuz.app/venue/la-santa?ref=tg)\n\n` +
        `2. 💃 *Vanderbilt* - Ambiente: 9.5/10\n` +
        `   [Ver Lista](https://venuz.app/venue/vanderbilt?ref=tg)\n\n` +
        `3. 🍻 *Gin Gin* - Chill: 10/10\n` +
        `   [Ver Menú](https://venuz.app/venue/gin-gin?ref=tg)`
    );
});

// Upsell Premium
bot.command('premium', (ctx) => {
    ctx.replyWithPhoto(
        { url: 'https://venuz.app/images/premium-card.jpg' }, // Placeholder
        {
            caption: `💎 *VENUZ Platinum Membership*\n\n` +
                `- Sin filas en 20+ clubs\n` +
                `- Botellas de regalo\n` +
                `- Concierge personal 24/7\n\n` +
                `👉 [Obtener Acceso Por $299 MXN](https://venuz.app/premium)`,
            parse_mode: 'Markdown'
        }
    );
});

// Exportar webhook handler compatible con Next.js (si se usa webhook mode)
export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        // Procesar update de Telegram (si usamos webhook directo a Telegraf)
        // Nota: Telegraf tiene su propio handleUpdate, aquí lo adaptamos
        await bot.handleUpdate(body);
        return new Response('OK');
    } catch (err) {
        console.error('Error in Telegram Growth Bot:', err);
        return new Response('Error', { status: 500 });
    }
};
