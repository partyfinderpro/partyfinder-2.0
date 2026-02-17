import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { text, parse_mode = 'Markdown' } = await request.json();
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const adminId = process.env.TELEGRAM_OWNER_ID || process.env.TELEGRAM_ADMIN_ID;

        if (!botToken || !adminId) {
            return NextResponse.json({ error: 'Missing Telegram configuration' }, { status: 500 });
        }

        const bot = new Telegraf(botToken);
        await bot.telegram.sendMessage(adminId, text, { parse_mode });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[NotifyAdmin] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
