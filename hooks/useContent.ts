import { useState, useEffect } from 'react';

// Simplified ContentItem interface for this emergency hook
export interface ContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    images?: string[];
    video_url?: string;
    category: string;
    location?: string;
    affiliate_url?: string;
    source_url?: string;
    is_premium?: boolean;
    is_verified?: boolean;
    quality_score?: number;
    created_at?: string;
    visual_style?: any;
    [key: string]: any; // Allow other fields
}

interface UseContentOptions {
    city?: string
    category?: string
    limit?: number
    offset?: number
    // Keep legacy props optional to avoid breaking other components if they pass them
    mode?: string
    search?: string
    latitude?: number | null
    longitude?: number | null
    radius?: number
    priceMin?: number
    priceMax?: number
    verifiedOnly?: boolean
    openNow?: boolean
}

export function useContent(options: UseContentOptions = {}) {
    const [content, setContent] = useState<ContentItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Default to Puerto Vallarta if no city is specified (Simulate "Vallarta Mode")
    const city = options.city || 'puerto-vallarta'
    const limit = options.limit || 50
    const offset = options.offset || 0

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams({
                    city: city, // Force city param
                    limit: limit.toString(),
                    offset: offset.toString(),
                })

                if (options.category) params.set('category', options.category)

                // Pass other params if they exist, just in case API uses them later
                if (options.search) params.set('search', options.search)

                const res = await fetch(`/api/feed?${params.toString()}`)
                const json = await res.json()

                if (!json.success && !json.data) throw new Error(json.error || 'Feed error')

                setContent(json.data || [])
            } catch (err: any) {
                setError('Error cargando el feed')
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFeed()
    }, [city, limit, offset, options.category, options.search])

    return {
        content, // Return as 'content' to match previous hook signature
        items: content, // Return as 'items' for flexibility
        isLoading, // loading -> isLoading
        loading: isLoading,
        error,
        hasMore: false, // Simplification for this emergency fix
        loadMore: async () => { },
        refresh: async () => { },
        totalCount: 0
    }
}

export default useContent;
