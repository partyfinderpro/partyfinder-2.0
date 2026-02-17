import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export interface AnalyticsEvent {
    event_type: 'page_view' | 'click' | 'favorite' | 'geo_alert_triggered';
    venue_id?: string;
    user_id?: string;
    session_id?: string;
    region_code?: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    metadata?: Record<string, any>;
}

/**
 * Tracks an event in the analytics_events table.
 * Designed to be called from Server Components or API Routes.
 */
export async function trackEvent(event: AnalyticsEvent) {
    try {
        const { error } = await supabase
            .from('analytics_events')
            .insert({
                event_type: event.event_type,
                venue_id: event.venue_id,
                user_id: event.user_id,
                session_id: event.session_id,
                region_code: event.region_code,
                utm_source: event.utm_source,
                utm_medium: event.utm_medium,
                utm_campaign: event.utm_campaign,
                utm_content: event.utm_content,
                metadata: event.metadata || {}
            });

        if (error) {
            console.error('[Analytics] Error tracking event:', error.message);
        }
    } catch (err) {
        console.error('[Analytics] Unexpected error:', err);
    }
}
