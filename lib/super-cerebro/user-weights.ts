
// src/lib/super-cerebro/user-weights.ts
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client manually as this runs on server side typically
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserCategoryWeights(userId: string) {
    // Get interactions from the last 7 days
    const { data: interactions, error } = await supabase
        .from('user_behavior')
        .select('interaction_type, value, content_id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // últimos 7 días

    if (error) {
        console.error("Error fetching user behavior:", error);
        return { adult: 40, events: 25, venues: 20, affiliates: 15 }; // Default fallback
    }

    const categoryScores: Record<string, number> = {};

    for (const int of interactions || []) {
        // Check if it's regular content
        let category = '';

        // Check content table first
        const { data: content } = await supabase
            .from('content')
            .select('category')
            .eq('id', int.content_id)
            .single();

        if (content?.category) {
            category = content.category;
        } else {
            // Check if it's a project resource / integrated affiliate
            const { data: resource } = await supabase
                .from('project_resources')
                .select('category')
                .eq('id', int.content_id)
                .single();

            if (resource?.category) {
                category = resource.category;
            }
        }

        if (category) {
            // Simple scoring logic: value provided (e.g. time spent) or defaulted by interaction type
            let score = int.value || 1;
            if (int.interaction_type === 'click') score = 5;
            if (int.interaction_type === 'like') score = 10;
            if (int.interaction_type === 'share') score = 15;
            if (int.interaction_type === 'skip') score = -5; // Negative reinforcement

            categoryScores[category] = (categoryScores[category] || 0) + score;
        }
    }

    // Normalizar pesos (suma = 100%)
    // If no scores, return defaults
    if (Object.keys(categoryScores).length === 0) {
        return { adult: 40, events: 25, venues: 20, affiliates: 15 };
    }

    // Ensure no negative scores for calculation
    const totalScore = Object.values(categoryScores).reduce((a, b) => a + Math.max(0, b), 0) || 1;

    const weights = Object.fromEntries(
        Object.entries(categoryScores).map(([cat, score]) => [cat, Math.round((Math.max(0, score) / totalScore) * 100)])
    );

    // Añadir pesos base para diversificar (si faltan categorías importantes)
    const baseWeights: Record<string, number> = { adult: 20, events: 15, venues: 15, affiliates: 10 }; // Lower base weights to mix in

    // Merge dynamic with base distinct categories
    // We want the AI to respect the calculated weights but keep variety. 
    // The prompt will use these weights as guidance.

    // Ensure "affiliates" key exists for safety in prompt
    if (!weights['affiliates']) weights['affiliates'] = 15;

    return weights;
}
