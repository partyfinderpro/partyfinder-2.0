import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
    normalizeGooglePlace,
    normalizeFoursquarePlace,
    normalizeYelpBusiness
} from '@/lib/normalizers';
import { NormalizedContent } from '@/types/content';

/**
 * GET: Fetch content with pagination and filters
 * Supports category filtering and "Hot Sorting" (shuffle-ish within same timeframe)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const limit = parseInt(searchParams.get('limit') || '12');
        const page = parseInt(searchParams.get('page') || '0');
        const category = searchParams.get('category');
        const priceLevel = searchParams.get('price_level');
        const minRating = searchParams.get('min_rating');

        let query = supabase
            .from('content')
            .select('*', { count: 'exact' });

        // Filters
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }
        if (priceLevel) {
            query = query.eq('price_level', parseInt(priceLevel));
        }
        if (minRating) {
            query = query.gte('rating', parseFloat(minRating));
        }

        // Sorting: Newest first, with secondary sort on title for stability
        query = query
            .order('scraped_at', { ascending: false })
            .order('title', { ascending: true })
            .range(page * limit, (page + 1) * limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            items: data || [],
            page,
            limit,
            total: count,
            nextPage: (data?.length || 0) === limit ? page + 1 : undefined
        });
    } catch (error: any) {
        console.error('❌ Error in GET /api/content:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST: Consumes raw data from any source, normalizes it, and upserts to DB
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { source, data } = body;

        // 1. Normalize based on source
        let normalized: NormalizedContent;
        switch (source) {
            case 'google_places':
                normalized = normalizeGooglePlace(data);
                break;
            case 'foursquare':
                normalized = normalizeFoursquarePlace(data);
                break;
            case 'yelp':
                normalized = normalizeYelpBusiness(data);
                break;
            default:
                return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
        }

        // 2. Intelligent Upsert Logic
        const res = await upsertContent(normalized);

        return NextResponse.json({ success: true, data: res });
    } catch (error: any) {
        console.error('❌ Error in POST /api/content:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Helper to perform upsert based on external_ids
 */
async function upsertContent(normalized: NormalizedContent) {
    // 1. Determine external IDs
    const gId = normalized.external_ids.google;
    const fId = normalized.external_ids.foursquare;
    const yId = normalized.external_ids.yelp;

    if (!gId && !fId && !yId) {
        throw new Error('No external_ids provided for upsert');
    }

    // 2. Search for existing record by any of the external IDs
    let orFilter = [];
    if (gId) orFilter.push(`external_ids->>google.eq.${gId}`);
    if (fId) orFilter.push(`external_ids->>foursquare.eq.${fId}`);
    if (yId) orFilter.push(`external_ids->>yelp.eq.${yId}`);

    const { data: existing, error: findError } = await supabase
        .from('content')
        .select('id, external_ids')
        .or(orFilter.join(','))
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        // 3a. UPDATE: Merge external_ids and update fields
        const mergedIds = {
            ...existing.external_ids,
            ...normalized.external_ids
        };

        const { data: result, error: updateError } = await supabase
            .from('content')
            .update({
                ...normalized,
                external_ids: mergedIds,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (updateError) throw updateError;
        return result;
    } else {
        // 3b. INSERT new record
        const { data: result, error: insertError } = await supabase
            .from('content')
            .insert(normalized)
            .select()
            .single();

        if (insertError) throw insertError;
        return result;
    }
}
