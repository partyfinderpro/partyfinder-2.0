import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/content?limit=1`, {
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
            },
        });

        if (!res.ok) throw new Error('DB down');

        // Log success (asynchronously)
        fetch(`${process.env.SUPABASE_URL}/rest/v1/system_logs`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ level: 'info', message: 'Health check OK' }),
        }).catch(err => console.error('Health log failed:', err));

        return NextResponse.json({ status: 'healthy' });
    } catch (error: any) {
        // Log error + alert Telegram (usa tu bot token)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_ID) {
            fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_OWNER_ID,
                    text: `🚨 VENUZ UNHEALTHY: ${error.message}`,
                }),
            }).catch(err => console.error('Telegram alert failed:', err));
        }

        return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 });
    }
}
