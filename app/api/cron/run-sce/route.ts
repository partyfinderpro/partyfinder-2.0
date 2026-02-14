
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Importar SCEs
import { SCENightlife } from '@/lib/sce/sce-nightlife';
import { SCEAdult } from '@/lib/sce/sce-adult';
import { SCEEventos } from '@/lib/sce/sce-eventos';
import { SCEClubs } from '@/lib/sce/sce-clubs';
import { SCEBares } from '@/lib/sce/sce-bares';
import { SCEMasajes } from '@/lib/sce/sce-masajes';

export const maxDuration = 300; // 5 minutos timeout para scraping

export async function GET(request: NextRequest) {
    // Verificar auth básica (cron secret)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Pipeline] Iniciando ejecución diaria de SCEs...');

        // 1. Instanciar y ejecutar todos los SCEs
        // Nota: En un entorno serverless real, Playwright puede necesitar configuración especial (AWS Lambda layer).
        // Aquí asumimos que el entorno soporta el binario o usamos la lógica de fallback interna de los SCEs.

        const sceNightlife = new SCENightlife();
        const sceAdult = new SCEAdult();
        const sceEventos = new SCEEventos();
        // Los otros SCEs siguen con dummy data por ahora para no sobrecargar el scraping en una sola pasada
        const sceClubs = new SCEClubs();
        const sceBares = new SCEBares();
        const sceMasajes = new SCEMasajes();

        const results = await Promise.allSettled([
            sceNightlife.run(),
            sceAdult.run(),
            sceEventos.run(),
            sceClubs.run(),
            sceBares.run(),
            sceMasajes.run()
        ]);

        // 2. Procesar resultados
        const flatResults = results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<any[]>).value)
            .flat();

        console.log(`[Pipeline] Total items obtenidos: ${flatResults.length}`);

        // 3. Guardar en Supabase (tabla 'scraped_content' o 'content')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let savedCount = 0;
        let errorCount = 0;

        for (const item of flatResults) {
            // Upsert basado en título o ID generado para evitar duplicados masivos
            // Si el item ya tiene ID, lo usamos.

            const dbItem = {
                title: item.title,
                description: item.description,
                image_url: item.image_url,
                category: item.category,
                source: item.source,
                quality_score: item.quality_score, // Score calculado por Gemini en BaseSCE
                active: true,
                raw_data: item, // Guardar el JSON crudo si es necesario
                last_updated: new Date().toISOString()
                // location: item.location ? `POINT(...)` : null // Manejo de GIS pendiente si la tabla lo soporta
            };

            // Insertar en scraped_content (si existe) o content
            // Asumiremos 'content' con un flag 'is_scraped' o fuente distinta
            // Ojo: Para este paso usaremos 'content' directamente para que el feed lo vea ya.

            const { error } = await supabase
                .from('content')
                .upsert(dbItem, { onConflict: 'title', ignoreDuplicates: true }); // Simplificación: usar título como key único aproximado

            if (!error) savedCount++;
            else errorCount++;
        }

        return NextResponse.json({
            success: true,
            items_scraped: flatResults.length,
            items_saved: savedCount,
            errors: errorCount,
            details: {
                nightlife: (results[0] as any).value?.length || 0,
                adult: (results[1] as any).value?.length || 0,
                eventos: (results[2] as any).value?.length || 0
            }
        });

    } catch (error: any) {
        console.error('[Pipeline] Error fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
