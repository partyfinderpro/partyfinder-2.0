
export interface NormalizedContent {
    title: string;
    description: string;
    category: string;
    price_level?: number;
    min_price?: number;
    max_price?: number;
    rating?: number;
    reviews_count?: number;
    external_ids: {
        google?: string;
        foursquare?: string;
        yelp?: string;
    };
    source_site: string;
    location_text?: string;
    lat?: number;
    lng?: number;
    image_url?: string;
    images?: string[];
    is_open_now?: boolean;
    opening_hours?: any;
    google_maps_url?: string;
    phone?: string;
    website?: string;
    tags?: string[];
    scraped_at?: string;
    created_at?: string;
    updated_at?: string;
}
