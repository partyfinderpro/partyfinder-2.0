
import { NextResponse } from 'next/server';
import { notifyDailySummary } from '@/lib/telegram-notify';

export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function supabaseQuery(endpoint: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });
    if (!response.ok) return [];
    return response.json();
}

export async function GET(req: Request) {
    try {
        // 1. Total content
        const content = await supabaseQuery('content?active=eq.true&select=category');
        const totalContent = Array.isArray(content) ? content.length : 0;

        // 2. New today
        const today = new Date().toISOString().split('T')[0];
        const newToday = await supabaseQuery(`content?created_at=gte.${today}T00:00:00&select=id`);
        const newTodayCount = Array.isArray(newToday) ? newToday.length : 0;

        // 3. Pending
        const pending = await supabaseQuery('pending_events?status=eq.pending&select=id');
        const pendingCount = Array.isArray(pending) ? pending.length : 0;

        // 4. Top Category
        const categories: Record<string, number> = {};
        if (Array.isArray(content)) {
            content.forEach((item: any) => {
                const cat = item.category || 'unknown';
                categories[cat] = (categories[cat] || 0) + 1;
            });
        }
        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

        // 5. Notify
        await notifyDailySummary({
            totalContent,
            newToday: newTodayCount,
            pendingCount,
            topCategory,
        });

        return NextResponse.json({
            status: 'ok',
            summary: {
                totalContent,
                newToday: newTodayCount,
                pendingCount,
                topCategory,
            }
        });

    } catch (error: any) {
        console.error('Daily summary error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
