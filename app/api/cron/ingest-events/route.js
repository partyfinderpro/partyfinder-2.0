import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PredictHQAPI from '@/scripts/connectors/predicthq';
import GooglePlacesAPI from '@/scripts/connectors/google_places';

export const maxDuration = 300;

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const results = {
        predicthq: { count: 0 },
        google_places: { count: 0 },
        timestamp: new Date().toISOString()
    };

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const cities = [
        { name: 'CDMX', lat: 19.4326, lng: -99.1332 },
        { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
        { name: 'Puerto Vallarta', lat: 20.6534, lng: -105.2253 },
        { name: 'Monterrey', lat: 25.6866, lng: -100.3161 },
        { name: 'Cancún', lat: 21.1619, lng: -86.8515 }
    ];

    try {
        // 1. PredictHQ
        const phq = new PredictHQAPI();
        for (const city of cities) {
            const events = await phq.search({ latitude: city.lat, longitude: city.lng, radius: '30km' });
            if (events?.length > 0) {
                const enriched = events.map(e => ({ ...e, location: city.name }));
                await supabase.from('content').upsert(enriched, { onConflict: 'source_url', ignoreDuplicates: true });
                results.predicthq.count += events.length;
            }
        }

        // 2. Google Places
        const google = new GooglePlacesAPI();
        for (const city of cities) {
            const places = await google.searchNearby({ latitude: city.lat, longitude: city.lng });
            if (places?.length > 0) {
                const enriched = places.map(p => ({ ...p, location: city.name }));
                await supabase.from('content').upsert(enriched, { onConflict: 'source_url', ignoreDuplicates: true });
                results.google_places.count += places.length;
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
