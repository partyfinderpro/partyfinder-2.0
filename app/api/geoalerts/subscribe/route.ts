
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { lat, lng, city, keywords } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('geo_alerts')
        .insert({
            user_id: user.id,
            lat,
            lng,
            city,
            keywords: keywords || ['fiesta', 'club', 'bar'],
        });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true });
}
