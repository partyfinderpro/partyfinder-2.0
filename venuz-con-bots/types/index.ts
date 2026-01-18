export interface Place {
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string | null;
    video_url?: string | null; // Agregado para compatibilidad con ContentCard
    url: string | null;
    location: any; // PostGIS geography type
    address?: string | null;
    location_text?: string | null; // Agregado para compatibilidad
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null; // Alias
    lng?: number | null; // Alias
    distance_meters?: number; // Retornado por get_nearby_places
    active?: boolean;
    source?: string | null;
    source_url?: string | null;
    created_at?: string;
    updated_at?: string;
    scraped_at?: string;
    rating?: number;
    total_ratings?: number;
    is_open_now?: boolean;
    images?: string[];
    price_level?: number;
    distance?: string;
}
