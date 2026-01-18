'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useGeolocation } from '@/hooks/useGeolocation';
import ContentCard from './ContentCard';
import VenueCard from './VenueCard';
import MapButton from './MapButton';
import RadiusSelector from './RadiusSelector';
import { RADIUS_LEVELS, shouldExpandRadius, formatRadiusDisplay } from '@/lib/geo-expansion';
import type { Place } from '@/types';
import type { MapPlace } from './MapView';

const ITEMS_PER_PAGE = 10;
const MIN_ITEMS_FOR_EXPANSION = 5;

interface InfiniteFeedProps {
    category?: string;
    useGeo?: boolean;
}

export default function InfiniteFeed({ category = 'all', useGeo = false }: InfiniteFeedProps) {
    const router = useRouter();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Nuevo: Estado de radio dinámico
    const [radiusIndex, setRadiusIndex] = useState(2); // Empieza en 5km
    const [currentRadius, setCurrentRadius] = useState(RADIUS_LEVELS[2]);
    const [autoExpanded, setAutoExpanded] = useState(false);

    const { latitude, longitude, error: geoError, loading: geoLoading, permissionDenied } = useGeolocation(useGeo);

    const fetchNearbyPlaces = useCallback(async (lat: number, lng: number, currentOffset: number, radius: number) => {
        try {
            const { data, error } = await supabase
                .rpc('get_nearby_places', {
                    user_lat: lat,
                    user_long: lng,
                    radius_meters: radius,
                    filter_category: category === 'all' ? null : category
                })
                .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching nearby places:', err);
            throw err;
        }
    }, [category]);

    const fetchRegularPlaces = useCallback(async (currentOffset: number) => {
        try {
            let query = supabase
                .from('content')
                .select('*')
                .eq('active', true);

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query
                .order('scraped_at', { ascending: false })
                .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching regular places:', err);
            throw err;
        }
    }, [category]);

    // Reset y recarga cuando cambia la categoría o ubicación
    useEffect(() => {
        const loadInitialPlaces = async () => {
            if (geoLoading) return;

            setLoading(true);
            setError(null);
            setPlaces([]); // Limpiar al cambiar filtro
            setOffset(0);

            try {
                let data: Place[];

                if (latitude && longitude) {
                    console.log(`🌍 [VENUZ] Geo-búsqueda (${category}): ${latitude}, ${longitude}`);
                    data = await fetchNearbyPlaces(latitude, longitude, 0, RADIUS_LEVELS[radiusIndex]);
                } else {
                    console.log(`📅 [VENUZ] Búsqueda normal (${category})`);
                    data = await fetchRegularPlaces(0);
                }

                setPlaces(data);
                setHasMore(data.length === ITEMS_PER_PAGE);
                setOffset(ITEMS_PER_PAGE);
            } catch (err) {
                setError('Error cargando lugares.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialPlaces();
    }, [latitude, longitude, geoLoading, category, fetchNearbyPlaces, fetchRegularPlaces]);

    // Load More
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            let data: Place[];
            if (latitude && longitude) {
                data = await fetchNearbyPlaces(latitude, longitude, offset, RADIUS_LEVELS[radiusIndex]);
            } else {
                data = await fetchRegularPlaces(offset);
            }

            if (data.length > 0) {
                setPlaces((prev) => [...prev, ...data]);
                setHasMore(data.length === ITEMS_PER_PAGE);
                setOffset((prev) => prev + ITEMS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, offset, loading, hasMore, fetchNearbyPlaces, fetchRegularPlaces]);

    // Scroll listener global
    useEffect(() => {
        const handleScroll = () => {
            // Detectar scroll en el contenedor principal o window
            const container = document.querySelector('.feed-container');
            if (container) {
                if (container.scrollTop + container.clientHeight >= container.scrollHeight - 500) {
                    loadMore();
                }
            }
        };

        // Attach to container if exists (mobile/desktop responsive layout)
        const container = document.querySelector('.feed-container');
        if (container) {
            container.addEventListener('scroll', handleScroll);
        } else {
            window.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadMore]);

    if ((geoLoading && places.length === 0) || (loading && places.length === 0)) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-10">
                <div className="w-16 h-16 border-4 border-venuz-pink border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 animate-pulse text-sm">Cargando...</p>
            </div>
        );
    }

    // Convertir places a MapPlace format
    const mapPlaces: MapPlace[] = places
        .filter(p => (p.lat || p.latitude) && (p.lng || p.longitude))
        .map(p => ({
            id: p.id,
            title: p.title,
            lat: p.lat || p.latitude || 0,
            lng: p.lng || p.longitude || 0,
            category: p.category || 'other',
            image_url: p.image_url,
            description: p.description,
            url: p.url,
        }));

    return (
        <div className="pb-20 w-full">
            {/* Banner Geo Feedback */}
            {latitude && longitude && (
                <div className="bg-neon-purple/5 border-b border-neon-purple/10 p-2 text-center backdrop-blur-sm sticky top-0 z-40 mb-4 mx-4 rounded-b-xl">
                    <p className="text-neon-purple text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
                        Radar IA activo: {RADIUS_LEVELS[radiusIndex] / 1000}km
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full min-h-[50vh]">
                {places.map((place) => (
                    <VenueCard
                        key={place.id}
                        id={place.id}
                        name={place.title}
                        category={place.category || 'other'}
                        images={place.images || [place.image_url]}
                        rating={place.rating}
                        reviewCount={place.total_ratings}
                        distance={place.distance}
                        priceLevel={place.price_level}
                        isLive={mounted ? (place.active && (place.title.length % 3 === 0)) : false}
                        activity={mounted ? (place.title.length * 7 % 100) : 50}
                        onClick={() => router.push(`/details/${place.id}`)}
                    />
                ))}

                {places.length === 0 && !loading && (
                    <div className="text-center py-20 px-6 text-gray-500">
                        No hay eventos en esta categoría cerca de ti.
                    </div>
                )}

                {loading && <div className="py-4 text-center text-xs text-gray-500">Cargando más...</div>}
            </div>

            {/* Botón flotante del mapa */}
            {mapPlaces.length > 0 && (
                <MapButton
                    places={mapPlaces}
                    onPlaceClick={(place) => {
                        console.log('Lugar seleccionado:', place);
                    }}
                />
            )}
        </div>
    );
}
