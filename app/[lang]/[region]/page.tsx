// app/[lang]/[region]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import HomePage from '../page'; // Reuse the homepage logic

export const dynamic = 'force-dynamic';

export default async function RegionPage({
    params
}: {
    params: { lang: string; region: string }
}) {
    // 1. Validar región
    const { data: region } = await supabase
        .from('regions')
        .select('*')
        .eq('code', params.region)
        .eq('is_active', true)
        .maybeSingle();

    if (!region) {
        notFound();
    }

    // 2. Renderizar HomePage pero con la ciudad/región pre-seleccionada
    // En el futuro, HomePage podría recibir una ciudad inicial via params
    // Por ahora, pasamos la región en el objeto params para que HomePage lo use si quiere
    return <HomePage params={{ ...params }} />;
}
