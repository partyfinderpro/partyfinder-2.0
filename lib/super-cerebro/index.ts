
// lib/super-cerebro/index.ts
import { llmRouter } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";
import { getUserCategoryWeights } from "./user-weights";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generarFeed(userId?: string, location?: { lat: number; lng: number }) {
    console.log('[Super Cerebro] Generando feed para:', userId || 'anon', location ? `en ${location.lat},${location.lng}` : 'sin ubicación');

    let weights: any = { adult: 40, events: 25, venues: 20, affiliates: 15 };
    if (userId) {
        try {
            weights = await getUserCategoryWeights(userId);
            console.log('[Super Cerebro] Pesos personalizados calculados:', weights);
        } catch (we) {
            console.warn('[Super Cerebro] Error calculando pesos, usando default:', we);
        }
    }

    // Factor hora (ej: después de 22h → +20% adult)
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
        // Increment adult weight, cap logic implicitly handled by having other weights stay same -> ratios shift
        // If we want to strictly follow prompting logic or math:
        weights.adult = Math.min(70, (weights.adult || 0) + 20);
        console.log('[Super Cerebro] Ajuste nocturno activado (Adult +20)');
    }

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

        // 1. Obtener contenido de DB (Tabla content legacy) and increase limit for better mixing
        const { data: dbContent, error: contentError } = await supabase
            .from('content')
            .select('*')
            .eq('active', true)
            .order('quality_score', { ascending: false })
            .limit(100);

        if (contentError) throw contentError;

        // Fusionar contenido
        const rawContent = [...sceContent, ...(dbContent || [])];

        // 1.1 Obtener AFILIADOS INTEGRADOS
        // Ahora usamos la tabla integrated_affiliates y project_resources
        const { data: integratedRaw, error: affError } = await supabase
            .from('integrated_affiliates')
            .select(`
                id,
                resource_id,
                feed_position_rule,
                project_resources!inner (
                    id,
                    title,
                    description,
                    url,
                    category,
                    affiliate_program,
                    commission_rate
                )
            `)
            .eq('active', true);

        if (affError) {
            console.error("Error fetching integrated affiliates:", affError);
        }

        // Mapear a formato uniforme de afiliado
        // Mapear a formato uniforme de afiliado
        const affiliates = integratedRaw?.map((item: any) => ({
            id: item.id, // ID de la integración
            resource_id: item.project_resources.id,
            title: item.project_resources.title,
            description: item.project_resources.description || `Oferta especial de ${item.project_resources.affiliate_program || 'Partner'}`,
            category: item.project_resources.category || 'ad',
            image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60', // Placeholder elegante para ads sin imagen
            type: 'ad',
            program: item.project_resources.affiliate_program,
            commission: item.project_resources.commission_rate,
            payout_per_click: 0,
            action_url: `/api/go?id=${item.project_resources.id}`
        })) || [];


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
            program: a.program
        }));

        const prompt = `
      Genera feed predictivo para usuario en ${location ? `${location.lat},${location.lng}` : 'ubicación desconocida'}.
      Contexto: Hora ${hour}h.
      Pesos personalizados: ${JSON.stringify(weights)}
      
      Reglas:
      - Prioriza cercanía geográfica si hay ubicación
      - Máximo 3 items seguidos de misma categoría
      - Inserta afiliados cada 6-8 items, preferiblemente ofertas relevantes a gustos
      - Incluye 1-2 curiosidades/sorpresas relevantes

      Contenido: ${JSON.stringify(contentForPrompt)}
      Afiliados: ${JSON.stringify(affiliatesForPrompt)}

      Devuelve SOLO array JSON de IDs ordenados:
      [{ id: "uuid", type: "...", score: 0.92 }]
    `;

        // USAR LLM ROUTER
        const responseText = await llmRouter.generateContent(prompt, { maxTokens: 2000, temperature: 0.4 });

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
                if (aff) {
                    // Inject tracking URL here
                    return {
                        ...aff,
                        // IMPORTANT: The frontend should render this as an ad card
                        // The URL action will be handled by the component using /api/go?id={resource_id}
                        action_url: `/api/go?id=${aff.resource_id}`
                    };
                }
                return null;
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
