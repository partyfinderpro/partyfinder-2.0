/**
 * VENUZ - Categories Library
 * 
 * Funciones para obtener categorías directamente de Supabase
 * en lugar de usar constantes hardcodeadas.
 * 
 * Sincronizado con DB Venuz - 5 Febrero 2026
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Category {
    id: string;
    slug: string;
    name: string;
    display_name: string;
    legacy_names: string[];
    icon: string;
    sort_order: number;
    is_active: boolean;
}

/**
 * Obtiene todas las categorías activas ordenadas
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name, display_name, legacy_names, icon, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data || [];
}

/**
 * Obtiene una categoría por su slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching category:', error);
        return null;
    }

    return data;
}

/**
 * Obtiene contenido por categoría usando category_id
 */
export async function getContentByCategory(categorySlug: string, limit: number = 50) {
    // Primero obtener el ID de la categoría
    const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

    if (!category) {
        console.warn(`Category not found: ${categorySlug}`);
        return [];
    }

    // Luego obtener el contenido
    const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('category_id', category.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching content by category:', error);
        return [];
    }

    return data || [];
}

/**
 * Obtiene conteo de contenido por categoría
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc('get_category_counts');

    if (error) {
        console.error('Error fetching category counts:', error);
        return {};
    }

    return data?.reduce((acc: Record<string, number>, item: { slug: string; count: number }) => {
        acc[item.slug] = item.count;
        return acc;
    }, {}) || {};
}

/**
 * Mapea una categoría legacy a su slug actual
 * Útil para migración gradual
 */
export function mapLegacyCategoryToSlug(legacyName: string, categories: Category[]): string | null {
    for (const cat of categories) {
        if (cat.legacy_names.includes(legacyName) || cat.slug === legacyName) {
            return cat.slug;
        }
    }
    return null;
}

// Categorías predefinidas para el sidebar (las más importantes)
export const SIDEBAR_CATEGORIES = [
    'webcams',
    'clubes-eventos',
    'servicios-adultos',
    'bares',
    'hookup-dating',
    'free-porn-tubes',
] as const;

// Categorías para el feed "Nightlife"
export const NIGHTLIFE_SLUGS = [
    'clubes-eventos',
    'bares',
    'conciertos',
    'restaurantes',
    'playas',
    'social-media',
];

// Categorías para el feed "Adult"
export const ADULT_SLUGS = [
    'webcams',
    'servicios-adultos',
    'servicios',
    'hookup-dating',
    'free-porn-tubes',
    'ai-porn',
    'premium-porn',
    'onlyfans',
    'contenido-xxx',
];

export default {
    getCategories,
    getCategoryBySlug,
    getContentByCategory,
    getCategoryCounts,
    mapLegacyCategoryToSlug,
    SIDEBAR_CATEGORIES,
    NIGHTLIFE_SLUGS,
    ADULT_SLUGS,
};
