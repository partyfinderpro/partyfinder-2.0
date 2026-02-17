// app/[lang]/[region]/map/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-900 animate-pulse rounded-[40px]" />
});
import Header from '@/components/Header';
import SidebarMenu from '@/components/SidebarMenu';
import { getTranslations } from 'next-intl/server';

export default async function MapPage({
    params
}: {
    params: { lang: string; region: string }
}) {
    // 1. Validar región y obtener centro coordenadas
    const { data: region } = await supabase
        .from('regions')
        .select('*')
        .eq('code', params.region)
        .eq('is_active', true)
        .maybeSingle();

    if (!region) {
        notFound();
    }

    // 2. Obtener venues con coordenadas en esta región
    // Nota: Filtramos por la ciudad de la región (usualmente el nombre de la región)
    const { data: venues } = await supabase
        .from('content')
        .select('id, title, description, latitude, longitude, category')
        .not('latitude', 'is', null)
        .eq('location', region.name); // O usar radio si tenemos coords de la región

    const t = await getTranslations({ locale: params.lang, namespace: 'nav' });

    return (
        <div className="flex h-screen bg-black overflow-hidden">
            <SidebarMenu lang={params.lang} />

            <main className="flex-1 flex flex-col relative h-full">
                <Header />

                <div className="flex-1 p-4 md:p-6 lg:p-8 relative z-0">
                    <div className="h-full w-full rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(236,72,153,0.15)] bg-zinc-900/50">
                        <InteractiveMap
                            venues={venues || []}
                            center={[region.latitude || 20, region.longitude || -100]}
                            zoom={12}
                            lang={params.lang}
                        />
                    </div>

                    {/* Quick Filters Overlay */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
                        <button className="px-6 py-3 bg-pink-500 text-white rounded-full font-bold text-xs shadow-xl shadow-pink-500/20 uppercase tracking-widest whitespace-nowrap">
                            Todo
                        </button>
                        <button className="px-6 py-3 bg-black/60 backdrop-blur-xl text-white/70 rounded-full font-bold text-xs border border-white/10 hover:text-white transition-all uppercase tracking-widest whitespace-nowrap">
                            Vida Nocturna
                        </button>
                        <button className="px-6 py-3 bg-black/60 backdrop-blur-xl text-white/70 rounded-full font-bold text-xs border border-white/10 hover:text-white transition-all uppercase tracking-widest whitespace-nowrap">
                            Adultos
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
