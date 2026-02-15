import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import GooglePlacesAPI from '@/scripts/connectors/google_places';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cities = [
        { name: 'CDMX', lat: 19.4326, lng: -99.1332 },
        { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
        { name: 'Puerto Vallarta', lat: 20.6534, lng: -105.2253 },
        { name: 'Cancún', lat: 21.1619, lng: -86.8515 },
        { name: 'Monterrey', lat: 25.6866, lng: -100.3161 }
    ];

    try {
        const google = new GooglePlacesAPI();
        let totalUpdated = 0;

        for (const city of cities) {
            const places = await google.searchNearby({ latitude: city.lat, longitude: city.lng });
            if (places && places.length > 0) {
                const enriched = places.map((p: any) => ({ ...p, location: city.name }));
                const { data, error } = await supabase
                    .from('content')
                    .upsert(enriched, { onConflict: 'source_url', ignoreDuplicates: true })
                    .select();

                if (!error) totalUpdated += data?.length || 0;
            }
        }

        return NextResponse.json({ success: true, updated: totalUpdated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
