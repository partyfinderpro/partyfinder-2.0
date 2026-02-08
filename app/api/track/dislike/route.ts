import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { content_id } = body;

        if (!content_id) {
            return NextResponse.json({ error: 'Missing content_id' }, { status: 400 });
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_dislikes`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_content_id: content_id }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('Error incrementing dislikes:', err);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Dislike tracking error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
