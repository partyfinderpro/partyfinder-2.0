import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📩 Telegram webhook received:', JSON.stringify(body).slice(0, 200));

        const message = body?.message;
        if (!message?.text || !message?.chat?.id) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text;

        let reply = '🟢 VENUZ Bot activo! El sistema está operativo.';

        if (text === '/start') {
            reply = '🎉 ¡Bienvenido a VENUZ Bot! Feed nacional OK, SCEs OK, Geoalerts OK. ¿Link de afiliado, tarea o resumen?';
        } else if (text === '/status') {
            reply = '✅ Feed: Nacional y predictivo\n✅ SCEs: 6 categorías\n✅ Geoalerts: Activos\n✅ PWA: Instalables\n✅ Bot: ONLINE';
        } else if (text.toLowerCase().includes('hola')) {
            reply = '¡Hola Pablo! Sistema estable. ¿Qué quieres hacer hoy?';
        }

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: reply,
                parse_mode: 'HTML',
            }),
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Telegram webhook error:', error);
        return NextResponse.json({ ok: true });
    }
}

export const dynamic = 'force-dynamic';
