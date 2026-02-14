
// lib/super-cerebro/index.ts
import { llmRouter } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generarFeed(userId?: string, location?: { lat: number; lng: number }) {
    console.log('[Super Cerebro] Generando feed para:', userId || 'anon', location ? `en ${location.lat},${location.lng}` : 'sin ubicación');

    try {
        // 0. Ejecutar SCEs (Sistemas Cognitivos Encapsulados)
        let sceContent: any[] = [];
        try {
            // Importar dinámicamente todos los SCEs
            const { SCENightlife } = await import('@/lib/sce/sce-nightlife');
            const { SCEAdult } = await import('@/lib/sce/sce-adult');
            const { SCEClubs } = await import('@/lib/sce/sce-clubs');
            const { SCEBares } = await import('@/lib/sce/sce-bares');
            const { SCEEventos } = await import('@/lib/sce/sce-eventos');
            const { SCEMasajes } = await import('@/lib/sce/sce-masajes');

            console.log('[Super Cerebro] Activando red neuronal de SCEs...');

            const sceNightlife = new SCENightlife();
            const sceAdult = new SCEAdult();
            const sceClubs = new SCEClubs();
            const sceBares = new SCEBares();
            const sceEventos = new SCEEventos();
            const sceMasajes = new SCEMasajes();

            // Ejecutar todos en paralelo
            const allSCEData = await Promise.all([
                sceNightlife.run().catch(e => { console.error('SCE Nightlife failed:', e); return []; }),
                sceAdult.run().catch(e => { console.error('SCE Adult failed:', e); return []; }),
                sceClubs.run().catch(e => { console.error('SCE Clubs failed:', e); return []; }),
                sceBares.run().catch(e => { console.error('SCE Bares failed:', e); return []; }),
                sceEventos.run().catch(e => { console.error('SCE Eventos failed:', e); return []; }),
                sceMasajes.run().catch(e => { console.error('SCE Masajes failed:', e); return []; })
            ]);

            const flatItems = allSCEData.flat();

            sceContent = flatItems.map(item => ({
                id: item.id || `sce-${Math.random().toString(36).substr(2, 9)}`,
                title: item.title,
                description: item.description,
                image_url: item.image_url,
                category: item.category,
                quality_score: item.quality_score,
                active: true,
                is_premium: false,
                source: `sce_${item.source}`,
                location: item.location ? `POINT(${item.location.lng} ${item.location.lat})` : null
            }));

            console.log(`[Super Cerebro] Red SCE aportó ${sceContent.length} items de ${allSCEData.length} fuentes`);

        } catch (sceError) {
            console.error('[Super Cerebro] Error crítica ejecutando red de SCEs:', sceError);
        }

        // 1. Obtener contenido de DB
        const { data: dbContent, error: contentError } = await supabase
            .from('content')
            .select('*')
            .eq('active', true)
            .order('quality_score', { ascending: false })
            .limit(60);

        if (contentError) throw contentError;

        // Fusionar contenido
        const rawContent = [...sceContent, ...(dbContent || [])];

        const { data: affiliates, error: affError } = await supabase
            .from('affiliate_links')
            .select('*')
            .eq('is_active', true);

        if (affError) throw affError;

        // 2. Enviar todo al Super Cerebro (LLM Router)
        const contentForPrompt = rawContent?.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            type: 'content',
            score: c.quality_score,
            location: c.location
        }));

        const affiliatesForPrompt = affiliates?.map(a => ({
            id: a.id,
            title: a.title,
            type: 'affiliate',
            payout: a.payout_per_click
        }));

        const prompt = `
      Eres el Super Cerebro del Feed de VENUZ.
      Tienes que generar un feed inteligente estilo TikTok/Casino para el usuario.
      
      Contexto Usuario:
      - Ubicación: ${location ? `${location.lat}, ${location.lng}` : 'Desconocida'}
      - User ID: ${userId || 'Anonimo'}

      Reglas:
      - Mezcla equilibrada: 40% Adulto/Party, 25% Eventos locales (prioriza cercanos si hay ubicación), 20% Venues, 15% Afiliados.
      - IMPORTANTE: Intercala afiliados (type: 'affiliate') cada 5-7 items de contenido normal.
      - Variedad: No pongas más de 3 items seguidos de la misma categoría.
      - Para contenido local lista 3 top.
      
      Contenido (JSON ligero): 
      ${JSON.stringify(contentForPrompt)}
      
      Afiliados: 
      ${JSON.stringify(affiliatesForPrompt)}

      Devuelve SOLO un array JSON válido con el orden final de IDs.
      Formato esperado:
      [ { "id": "uuid", "type": "content" }, { "id": "uuid", "type": "affiliate" }, ... ]
    `;

        // USAR LLM ROUTER
        const responseText = await llmRouter.generateContent(prompt, 2000, 0.4);

        // Limpieza básica
        const cleanResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let feedOrder: { id: string, type: string }[] = [];
        try {
            feedOrder = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("Error parseando feed del Super Cerebro", e, "Response was:", cleanResponse);
            return interleaveFallback(rawContent, affiliates);
        }

        // 3. Reconstruir feed
        const finalFeed = feedOrder.map(item => {
            if (item.type === 'affiliate') {
                const aff = affiliates?.find(a => a.id === item.id);
                return aff ? { ...aff, type: 'ad' } : null;
            } else {
                const cont = rawContent?.find(c => c.id === item.id);
                return cont ? { ...cont, type: 'content' } : null;
            }
        }).filter(item => item !== null);

        // Relleno si es necesario
        if (finalFeed.length < 10 && rawContent && rawContent.length > 0) {
            console.log("Feed generado muy corto, rellenando con fallback.");
            const usedIds = new Set(finalFeed.map(i => i.id));
            const remaining = rawContent.filter(c => !usedIds.has(c.id));
            return [...finalFeed, ...remaining];
        }

        return finalFeed;

    } catch (err) {
        console.error("Error crítico en Super Cerebro:", err);
        return [];
    }
}

function interleaveFallback(content: any[], affiliates: any[]) {
    if (!content) return [];
    if (!affiliates || affiliates.length === 0) return content;

    const result = [];
    let affIndex = 0;

    for (let i = 0; i < content.length; i++) {
        result.push({ ...content[i], type: 'content' });
        if ((i + 1) % 6 === 0) {
            const aff = affiliates[affIndex % affiliates.length];
            result.push({ ...aff, type: 'ad' });
            affIndex++;
        }
    }
    return result;
}
