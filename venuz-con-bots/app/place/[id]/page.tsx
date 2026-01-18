// app/place/[id]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import PlaceDetailClient from './PlaceDetailClient';

// Server-side Supabase client
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface PageProps {
    params: { id: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = getSupabase();
    const { data: place } = await supabase
        .from('content')
        .select('title, description, category')
        .eq('id', params.id)
        .single();

    if (!place) {
        return { title: 'Lugar no encontrado - VENUZ' };
    }

    return {
        title: `${place.title} - VENUZ`,
        description: place.description || `Descubre ${place.title} en VENUZ`,
    };
}

export default async function PlacePage({ params }: PageProps) {
    const supabase = getSupabase();

    const { data: place, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !place) {
        notFound();
    }

    return <PlaceDetailClient place={place} />;
}
