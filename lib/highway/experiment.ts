// lib/highway/experiment.ts

import { supabase } from '@/lib/supabase';

/**
 * Obtiene o asigna una variante A/B para un usuario.
 * Esta versión es segura para usar en servidor y cliente (si se provee userId).
 */
export async function getUserExperimentVariant(
    experimentName: string,
    userId: string
): Promise<'A' | 'B'> {
    if (!userId) return 'A';

    // 1. Ver si ya está asignado en BD
    try {
        const { data: assignment } = await supabase
            .from('highway_assignments')
            .select('variant')
            .eq('user_id', userId)
            .eq('experiment_name', experimentName)
            .maybeSingle();

        if (assignment) return assignment.variant as 'A' | 'B';
    } catch (e) {
        console.warn('[Experiment] Error fetching assignment:', e);
    }

    // 2. Si no está asignado, obtener configuración del experimento
    try {
        const { data: exp } = await supabase
            .from('highway_experiments')
            .select('traffic_split, is_active')
            .eq('name', experimentName)
            .maybeSingle();

        if (!exp || !exp.is_active) return 'A';

        // 3. Asignar aleatoriamente según split
        const randomVal = Math.random() * 100;
        const variant = randomVal < (exp.traffic_split || 50) ? 'B' : 'A';

        // 4. Guardar asignación (Async, no bloqueante)
        supabase.from('highway_assignments').insert({
            user_id: userId,
            experiment_name: experimentName,
            variant
        }).then(({ error }) => {
            if (error) console.error('[Experiment] Error saving assignment:', error);
        });

        return variant;
    } catch (e) {
        return 'A';
    }
}
