import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('mission_id');
    const secret = searchParams.get('secret');

    // Simple security check (replace with a real token in production)
    if (secret !== process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (missionId === 'discovery') {
        const results = await runDiscoveryMission();
        return NextResponse.json({ success: true, mission: 'discovery', results });
    }

    if (missionId === 'highway') {
        const results = await runHighwayMission();
        return NextResponse.json({ success: true, mission: 'highway', results });
    }

    return NextResponse.json({ error: 'Unknown mission' }, { status: 400 });
}

async function runDiscoveryMission() {
    console.log('[AGENT] Starting Discovery Mission...');

    // Aquí el agente ya tiene acceso a las credenciales via lib/supabase-admin
    const venuesToAdd = [
        {
            title: 'Mode Miami',
            description: 'Ubicado en el centro de Miami, Mode ofrece una experiencia de dos niveles. El sótano, un antiguo refugio de la Guerra Fría, cuenta con un sistema de sonido e iluminación de primer nivel enfocado en house y techno.',
            category: 'club',
            location: 'Miami',
            latitude: 25.7743,
            longitude: -80.1937,
            image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67',
            source_site: 'agent_discovery',
            status: 'published',
            quality_score: 95
        },
        {
            title: 'Jolene Sound Room',
            description: 'Inspirado en los años 70, este sótano histórico en el downtown de Miami es conocido por su sonido groovy y disco.',
            category: 'club',
            location: 'Miami',
            latitude: 25.7750,
            longitude: -80.1910,
            image_url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1',
            source_site: 'agent_discovery',
            status: 'published',
            quality_score: 92
        }
    ];

    const { data, error } = await supabase
        .from('content')
        .upsert(venuesToAdd, { onConflict: 'title, location' });

    return { added: venuesToAdd.length, error: error?.message };
}

async function runHighwayMission() {
    console.log('[AGENT] Starting Highway Analysis Mission...');

    // 1. Obtener experimentos activos
    const { data: experiments } = await supabase
        .from('highway_experiments')
        .select('*')
        .eq('is_active', true);

    // 2. Mock de análisis (en la siguiente iteración será real)
    const analysis = experiments?.map(exp => ({
        id: exp.id,
        status: 'stable',
        recommendation: 'keep_variations'
    }));

    return { analyzed: experiments?.length || 0, analysis };
}
