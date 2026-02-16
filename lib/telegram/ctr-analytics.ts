// lib/telegram/ctr-analytics.ts

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface CTRStats {
    content_id: string;
    title: string;
    category: string;
    total_impressions: number;
    total_clicks: number;
    ctr_percentage: number;
    total_conversions: number;
    total_revenue: number;
    last_impression: string;
    last_click: string;
}

export class CTRAnalytics {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
        );
    }

    async recordImpression(
        contentId: string,
        sessionId: string,
        context: {
            feedPosition?: number;
            feedType?: string;
            category?: string;
            location?: string;
            userAgent?: string;
            isMobile?: boolean;
        }
    ): Promise<void> {
        try {
            await this.supabase.from('content_impressions').insert({
                content_id: contentId,
                session_id: sessionId,
                feed_position: context.feedPosition,
                feed_type: context.feedType,
                category: context.category,
                location: context.location,
                user_agent: context.userAgent,
                is_mobile: context.isMobile ?? true,
            });
        } catch (err) {
            logger.error('[CTRAnalytics] Error recording impression', { err, contentId });
        }
    }

    async recordClick(
        contentId: string,
        sessionId: string,
        clickType: 'details' | 'external_link' | 'share' | 'like' | 'affiliate',
        context?: {
            fromFeedPosition?: number;
            feedType?: string;
        }
    ): Promise<void> {
        try {
            await this.supabase.from('content_clicks').insert({
                content_id: contentId,
                session_id: sessionId,
                click_type: clickType,
                from_feed_position: context?.fromFeedPosition,
                feed_type: context?.feedType,
            });
        } catch (err) {
            logger.error('[CTRAnalytics] Error recording click', { err, contentId, clickType });
        }
    }

    async getLowPerformingContent(
        threshold = 1.0, // CTR < 1%
        minImpressions = 100,
        limit = 20
    ): Promise<CTRStats[]> {
        try {
            const { data, error } = await this.supabase
                .from('content_ctr_stats')
                .select('*')
                .lt('ctr_percentage', threshold)
                .gte('total_impressions', minImpressions)
                .order('total_impressions', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('[CTRAnalytics] Error fetching low performing content', { error });
                return [];
            }

            return data || [];
        } catch (err) {
            logger.error('[CTRAnalytics] Exception fetching low performing content', { err });
            return [];
        }
    }

    async getTopPerformingContent(limit = 20): Promise<CTRStats[]> {
        try {
            const { data, error } = await this.supabase
                .from('content_ctr_stats')
                .select('*')
                .gte('total_impressions', 50)
                .order('ctr_percentage', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('[CTRAnalytics] Error fetching top performing content', { error });
                return [];
            }

            return data || [];
        } catch (err) {
            logger.error('[CTRAnalytics] Exception fetching top performing content', { err });
            return [];
        }
    }

    async getOverallCTR(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
        impressions: number;
        clicks: number;
        ctr: number;
    }> {
        try {
            const now = new Date();
            let since = new Date();

            switch (timeframe) {
                case '24h':
                    since.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    since.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    since.setDate(now.getDate() - 30);
                    break;
            }

            const [impressionsRes, clicksRes] = await Promise.all([
                this.supabase
                    .from('content_impressions')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', since.toISOString()),
                this.supabase
                    .from('content_clicks')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', since.toISOString()),
            ]);

            const impressions = impressionsRes.count || 0;
            const clicks = clicksRes.count || 0;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

            return { impressions, clicks, ctr };
        } catch (err) {
            logger.error('[CTRAnalytics] Error getting overall CTR', { err, timeframe });
            return { impressions: 0, clicks: 0, ctr: 0 };
        }
    }

    async refreshStats(): Promise<boolean> {
        try {
            const { error } = await this.supabase.rpc('refresh_content_ctr_stats');

            if (error) {
                logger.error('[CTRAnalytics] Error refreshing stats', { error });
                return false;
            }

            logger.info('[CTRAnalytics] Stats refreshed successfully');
            return true;
        } catch (err) {
            logger.error('[CTRAnalytics] Exception refreshing stats', { err });
            return false;
        }
    }
}

export const ctrAnalytics = new CTRAnalytics();
