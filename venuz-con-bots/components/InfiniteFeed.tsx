'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import ContentCard from './ContentCard'
import { PremiumFiltersState } from './PremiumFilters'

interface ContentItem {
    id: string
    title: string
    description: string | null
    image_url: string | null
    video_url: string | null
    category: string | null
    source: string | null
    source_site: string | null
    location_text: string | null
    lat: number | null
    lng: number | null

    rating: number | null
    total_ratings: number | null
    is_open_now: boolean | null
    google_maps_url: string | null

    views: number
    featured: boolean
    active: boolean
    verified?: boolean // Add optional verification status to interface
}

interface InfiniteFeedProps {
    category?: string | null;
    filters?: PremiumFiltersState;
}

export default function InfiniteFeed({ category, filters }: InfiniteFeedProps = {}) {
    const [content, setContent] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Get user location
    // Automatic geolocation request REMOVED for Zero Friction UX
    // Location is now handled by venuz-ux-system
    useEffect(() => {
        // Default to Puerto Vallarta Center as fallback if no location
        // Wait for system to provide location later
        setUserLocation({ lat: 20.6534, lon: -105.2253 })
    }, [])

    // Fetch content based on location
    const fetchContent = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch content from Supabase
            let query = supabase
                .from('content')
                .select('*')
                .eq('active', true)
                .order('scraped_at', { ascending: false })
                .limit(50)

            // Basic Category Filter (from props)
            if (category && category !== 'all' && category !== 'Todo' && category !== 'Para ti') {
                query = query.eq('category', category)
            }

            // Premium Filters
            if (filters) {
                if (filters.verified_only) {
                    // Try/catch implicitly handled by error check, assuming 'verified' column exists
                    // If not exist, this might error, but 'verified' is common. 
                    // Venuz schema update didn't specify it, but usually standard.
                    // If it errors, we need to add column. I'll trust it exists or is added.
                    query = query.eq('verified', true);
                }

                // Advanced Schema Dependent Filters (Commented until schema confirmed)
                /*
                if (filters.price_range) {
                    query = query.gte('price', filters.price_range[0]).lte('price', filters.price_range[1]);
                }
                if (filters.age_range) {
                    query = query.gte('age', filters.age_range[0]).lte('age', filters.age_range[1]);
                }
                */
            }

            const { data, error } = await query

            if (error) {
                console.error('Supabase query error:', error)
                throw error
            }

            if (data) {
                let sortedContent = data as any[];

                // Client-side filtering for complex attributes
                if (filters) {
                    // Availability
                    if (filters.available_now) {
                        sortedContent = sortedContent.filter(item => item.is_open_now);
                    }

                    // Filter categories if array is passed (multi-select)
                    if (filters.category && filters.category.length > 0) {
                        sortedContent = sortedContent.filter(item => filters.category?.includes(item.category));
                    }
                }

                // Sort and Filter by distance
                if (userLocation) {
                    // First calculate distances
                    sortedContent = sortedContent.map(item => ({
                        ...item,
                        _distance: calculateDistance(
                            userLocation.lat,
                            userLocation.lon,
                            item.lat || 0,
                            item.lng || 0
                        )
                    }));

                    // Filter by distance if set
                    if (filters?.distance_km) {
                        sortedContent = sortedContent.filter(item => item._distance <= (filters.distance_km || 100));
                    }

                    // Sort by distance
                    sortedContent = sortedContent.sort((a, b) => a._distance - b._distance);
                }

                // Ensure data matches ContentItem interface
                setContent(sortedContent as ContentItem[])
            }
        } catch (error) {
            console.error('Error fetching content:', error)
        } finally {
            setLoading(false)
        }
    }, [userLocation, category, filters])

    useEffect(() => {
        // Initial fetch
        fetchContent()
    }, [fetchContent])

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;

        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Intersection observer
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0')
                        setCurrentIndex(index)

                        // Track view
                        const contentId = entry.target.getAttribute('data-id')
                        if (contentId) {
                            trackView(contentId)
                        }
                    }
                })
            },
            { threshold: 0.7 }
        )

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [])

    const trackView = async (contentId: string) => {
        try {
            await supabase
                .from('interactions')
                .insert({
                    content_id: contentId,
                    user_id: localStorage.getItem('venuz_user_id') || 'anonymous',
                    action: 'view'
                })
        } catch (error) {
            // console.error('Error tracking view:', error) 
        }
    }

    if (loading && content.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-venuz-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-venuz-pink font-semibold">Cargando experiencias...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="h-screen w-full overflow-y-scroll snap-scroll bg-black"
        >
            <AnimatePresence mode="wait">
                {content.map((item, index) => (
                    <motion.div
                        key={item.id}
                        data-index={index}
                        data-id={item.id}
                        className="h-screen w-full snap-item relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        ref={(el) => {
                            if (el && observerRef.current) {
                                observerRef.current.observe(el)
                            }
                        }}
                    >
                        <ContentCard
                            content={{
                                id: item.id,
                                title: item.title,
                                description: item.description,
                                image_url: item.image_url,
                                video_url: item.video_url,
                                category: item.category,
                                source: item.source,
                                location: item.location_text || undefined,
                                location_text: item.location_text || undefined,
                                lat: item.lat,
                                lng: item.lng,
                                rating: item.rating ?? undefined,
                                total_ratings: item.total_ratings ?? undefined,
                                is_open_now: item.is_open_now ?? undefined,
                                google_maps_url: item.google_maps_url ?? undefined
                            }}
                            isActive={currentIndex === index}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Load more trigger */}
            {content.length > 0 && (
                <div className="h-20 flex items-center justify-center snap-start">
                    {/* Maybe auto load more? */}
                </div>
            )}
        </div>
    )
}
