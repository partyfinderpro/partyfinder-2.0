'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function useAnalytics() {
    const trackEvent = useCallback(async (
        eventType: 'view' | 'search' | 'favorite' | 'share' | 'click',
        contentId?: string,
        metadata?: Record<string, any>
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: eventType,
                    content_id: contentId,
                    user_id: user?.id,
                    metadata: metadata || {}
                })
            });
        } catch (err) {
            console.error('Error tracking event:', err);
        }
    }, []);

    const trackView = useCallback((contentId: string) => {
        trackEvent('view', contentId);
    }, [trackEvent]);

    const trackSearch = useCallback(
        debounce((query: string) => {
            trackEvent('search', undefined, { query });
        }, 1000),
        [trackEvent]
    );

    const trackFavorite = useCallback((contentId: string, action: 'add' | 'remove') => {
        trackEvent('favorite', contentId, { action });
    }, [trackEvent]);

    const trackShare = useCallback((contentId: string, platform?: string) => {
        trackEvent('share', contentId, { platform });
    }, [trackEvent]);

    return { trackView, trackSearch, trackFavorite, trackShare, trackEvent };
}
