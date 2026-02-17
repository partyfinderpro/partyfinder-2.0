import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://venuz.app';
    const locales = ['es', 'en', 'pt', 'fr'];

    // 1. Get all active regions
    const { data: regions } = await supabase
        .from('regions')
        .select('code')
        .eq('is_active', true);

    // 2. Get all content IDs for deep links
    const { data: contents } = await supabase
        .from('content')
        .select('id, updated_at')
        .limit(100); // Limit to top 100 for now to avoid huge sitemap

    const entries: MetadataRoute.Sitemap = [];

    // Main pages for each locale
    locales.forEach(lang => {
        entries.push({
            url: `${baseUrl}/${lang}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        });
    });

    // Region pages
    if (regions) {
        regions.forEach(region => {
            locales.forEach(lang => {
                entries.push({
                    url: `${baseUrl}/${lang}/${region.code}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.8,
                });
            });
        });
    }

    // Content detail pages
    if (contents) {
        contents.forEach(item => {
            locales.forEach(lang => {
                entries.push({
                    url: `${baseUrl}/${lang}/content/${item.id}`,
                    lastModified: new Date(item.updated_at || new Date()),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            });
        });
    }

    return entries;
}
