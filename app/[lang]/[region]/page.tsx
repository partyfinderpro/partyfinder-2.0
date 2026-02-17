import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import HomePage from '../page';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { lang: string; region: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale: params.lang, namespace: 'seo' });

    // Fetch region name for SEO
    const { data: region } = await supabase
        .from('regions')
        .select('name')
        .eq('code', params.region)
        .maybeSingle();

    const regionName = region?.name || params.region.split('-')[0].toUpperCase();

    return {
        title: t('title', { region: regionName }),
        description: t('description', { region: regionName }),
        alternates: {
            languages: {
                'es': `/es/${params.region}`,
                'en': `/en/${params.region}`,
                'pt': `/pt/${params.region}`,
                'fr': `/fr/${params.region}`,
            },
        },
        openGraph: {
            title: t('og_title', { region: regionName }),
            description: t('og_description'),
            images: [`/og/${params.region}.jpg`],
            url: `https://venuz.app/${params.lang}/${params.region}`,
            type: 'website',
        }
    };
}

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
    return <HomePage params={{ ...params }} />;
}
