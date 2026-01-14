'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useGeolocation } from '@/hooks/useGeolocation';
import ContentCard from './ContentCard';
import type { Place } from '@/types';

const ITEMS_PER_PAGE = 10;
const DEFAULT_RADIUS_METERS = 20000; // 20km

interface InfiniteFeedProps {
    category?: string;
}

export default function InfiniteFeed({ category = 'all' }: InfiniteFeedProps) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const { latitude, longitude, error: geoError, loading: geoLoading, permissionDenied } = useGeolocation();

    const fetchNearbyPlaces = useCallback(async (lat: number, lng: number, currentOffset: number) => {
        try {
            const { data, error } = await supabase
                .rpc('get_nearby_places', {
                    user_lat: lat,
                    user_long: lng,
                    radius_meters: DEFAULT_RADIUS_METERS,
                    filter_category: category === 'all' ? null : category
                })
                .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching nearby places:', err);
            throw err;
        }
    }, [category]); // Depende de la categoría

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
                    data = await fetchNearbyPlaces(latitude, longitude, 0);
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
                data = await fetchNearbyPlaces(latitude, longitude, offset);
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

    return (
        <div className="pb-20 w-full">
            {/* Banner Geo Feedback */}
            {latitude && longitude && (
                <div className="bg-venuz-pink/5 border-b border-venuz-pink/10 p-2 text-center backdrop-blur-sm sticky top-0 z-40 mb-4 mx-4 rounded-b-xl">
                    <p className="text-venuz-pink text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                        <span>📡</span> Radar activo: {(DEFAULT_RADIUS_METERS / 1000).toFixed(0)}km
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center w-full min-h-[50vh]">
                {places.map((place) => (
                    <div key={place.id} className="w-full snap-start sm:py-4">
                        <ContentCard content={place} isActive={true} />
                    </div>
                ))}

                {places.length === 0 && !loading && (
                    <div className="text-center py-20 px-6 text-gray-500">
                        No hay eventos en esta categoría cerca de ti.
                    </div>
                )}

                {loading && <div className="py-4 text-center text-xs text-gray-500">Cargando más...</div>}
            </div>
        </div>
    );
}
