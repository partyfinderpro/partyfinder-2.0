// Normalizers for different APIs implemented to unify data for VENUZ
import { NormalizedContent } from '@/types/content';
import {
    detectCategoryFromGoogleTypes,
    detectCategoryFromFoursquare,
    detectCategoryFromYelp
} from './categoryMapper';
import { extractTags, addMetadataTags } from './tagExtractor';
import {
    processGooglePhotos,
    processFoursquarePhotos,
    processYelpPhotos,
    getImagePlaceholder
} from './imageOptimizer';

export function normalizeGooglePlace(data: any): NormalizedContent {
    const category = detectCategoryFromGoogleTypes(data.types || []);

    const baseTags = extractTags(
        data.name,
        data.editorial_summary?.overview || '',
        (data.types || []).join(' ')
    );

    const { primary, additional } = processGooglePhotos(
        data.photos,
        process.env.GOOGLE_PLACES_API_KEY!
    );

    const tags = addMetadataTags(baseTags, {
        priceLevel: data.price_level,
        rating: data.rating,
        isOpenNow: data.opening_hours?.open_now,
        category
    });

    return {
        title: data.name,
        description: data.editorial_summary?.overview || data.formatted_address,
        category,
        price_level: data.price_level ? data.price_level + 1 : undefined, // Google uses 0-4 range, we prefer 1-5 or ensure consistency
        rating: data.rating,
        reviews_count: data.user_ratings_total,
        external_ids: {
            google: data.place_id
        },
        source_site: 'google_places',
        location_text: data.formatted_address,
        lat: data.geometry?.location?.lat,
        lng: data.geometry?.location?.lng,
        image_url: primary || getImagePlaceholder(category),
        images: additional,
        is_open_now: data.opening_hours?.open_now,
        opening_hours: data.opening_hours?.weekday_text,
        google_maps_url: data.url,
        phone: data.formatted_phone_number,
        website: data.website,
        tags,
        scraped_at: new Date().toISOString()
    };
}

export function normalizeFoursquarePlace(data: any): NormalizedContent {
    const category = detectCategoryFromFoursquare(data.categories || []);

    const baseTags = extractTags(
        data.name,
        data.description || '',
        (data.categories || []).map((c: any) => c.name).join(' ')
    );

    const { primary, additional } = processFoursquarePhotos(data.photos);

    const tags = addMetadataTags(baseTags, {
        priceLevel: data.price,
        rating: data.rating ? data.rating / 2 : undefined, // FSQ is 0-10, we want 0-5
        category
    });

    return {
        title: data.name,
        description: data.description || data.location?.formatted_address,
        category,
        price_level: data.price, // FSQ 1-4
        rating: data.rating ? data.rating / 2 : undefined,
        reviews_count: data.stats?.total_ratings,
        external_ids: {
            foursquare: data.fsq_id
        },
        source_site: 'foursquare',
        location_text: data.location?.formatted_address,
        lat: data.geocodes?.main?.latitude,
        lng: data.geocodes?.main?.longitude,
        image_url: primary || getImagePlaceholder(category),
        images: additional,
        phone: data.tel,
        website: data.website,
        tags,
        scraped_at: new Date().toISOString()
    };
}

export function normalizeYelpBusiness(data: any): NormalizedContent {
    const category = detectCategoryFromYelp(data.categories || []);

    const baseTags = extractTags(
        data.name,
        '', // Yelp API detail often needed for description, list endpoint has limited info
        (data.categories || []).map((c: any) => c.alias).join(' ')
    );

    const { primary, additional } = processYelpPhotos(
        data.photos || (data.image_url ? [data.image_url] : [])
    );

    const tags = addMetadataTags(baseTags, {
        priceLevel: data.price ? data.price.length : undefined, // "$$" -> 2
        rating: data.rating,
        isOpenNow: !data.is_closed,
        category
    });

    return {
        title: data.name,
        description: data.location?.address1 || data.display_phone, // Fallback as Yelp list API is sparse on descriptions
        category,
        price_level: data.price ? data.price.length : undefined,
        rating: data.rating,
        reviews_count: data.review_count,
        external_ids: {
            yelp: data.id
        },
        source_site: 'yelp',
        location_text: `${data.location?.address1}, ${data.location?.city}`,
        lat: data.coordinates?.latitude,
        lng: data.coordinates?.longitude,
        image_url: primary || getImagePlaceholder(category),
        images: additional,
        is_open_now: !data.is_closed,
        phone: data.phone,
        website: data.url,
        tags,
        scraped_at: new Date().toISOString()
    };
}
