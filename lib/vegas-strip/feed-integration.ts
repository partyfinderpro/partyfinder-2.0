import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { HighwayContentItem } from '@/lib/highwayAlgorithm';
import { applyNightlifeGrade } from './visual-enhancer';

/**
 * Recupera items scrapeados y los formatea como HighwayContentItems.
 * Esto permite inyectarlos en el feed principal sin cambios masivos.
 */
export async function getVegasStripItems(limit: number = 20): Promise<HighwayContentItem[]> {
    const { data, error } = await supabase
        .from('scraped_items')
        .select('*')
        .eq('is_published', true)
        .order('priority_level', { ascending: false }) // Los mejores primero
        .limit(limit);

    if (error || !data) return [];

    return data.map(item => {
        const vibe = item.vibe || [];
        const visualStyle = applyNightlifeGrade(vibe);

        return {
            id: item.id,
            title: item.title, // Usa rewritten_title si existe
            description: item.description,
            image_url: item.hero_image_url,
            category: item.category,
            pillar: 'adult', // Por defecto 'adult' para monetización, o 'event' si es party

            // Campos específicos de Vegas Strip (se guardan en extra_data para el frontend)
            extra_data: {
                is_vegas_strip: true,
                visual_style: visualStyle,
                vibe: vibe,
                affiliate_url: item.affiliate_url || item.original_url,
                item_type: item.item_type
            },

            // Meta fake para Highway
            likes: Math.floor(Math.random() * 50) + 10,
            views: Math.floor(Math.random() * 500) + 100,
            created_at: item.created_at,
            is_verified: true, // Auto-verified por el agente
            is_premium: item.priority_level > 8,

            // Scoring explicito para Highway Mixer
            finalScore: (item.priority_level * 20) + 100, // Force high visibility
            pillarWeight: 1.0
        } as unknown as HighwayContentItem; // Cast por si faltan campos menores
    });
}
