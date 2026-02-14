
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated model name to be safer or use flash-latest if valid

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generarFeed(userId?: string, location?: { lat: number; lng: number }) {
    console.log('[Super Cerebro] Generando feed para:', userId || 'anon', location ? `en ${location.lat},${location.lng}` : 'sin ubicación');

    try {
        // 0. Ejecutar SCEs (Sistemas Cognitivos Encapsulados)
        // Integración de fuentes vivas/scraped al momento
        let sceContent: any[] = [];
        try {
            // Importar dinámicamente todos los SCEs para code-splitting
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

            // Mapeamos al formato de la DB para unificar
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

        // 1. Obtener contenido crudo (eventos, venues, scraped_content, afiliados)
        // Obtenemos un mix de contenido de alta calidad de la DB
        const { data: dbContent, error: contentError } = await supabase
            .from('content') // Usamos 'content' que es la vista unificada o tabla principal
            .select('*')
            .eq('active', true)
            .order('quality_score', { ascending: false })
            .limit(60);

        if (contentError) throw contentError;

        // Fusionar contenido de DB y de SCEs
        const rawContent = [...sceContent, ...(dbContent || [])];

        const { data: affiliates, error: affError } = await supabase
            .from('affiliate_links')
            .select('*')
            .eq('is_active', true);

        if (affError) throw affError;

        // 2. Enviar todo al Super Cerebro (Gemini) para que decida el orden final
        // Preparamos un subset ligero para el prompt para no exceder tokens
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
      - Para contenido local (eventos/venues), prioriza lo que parezca estar cerca si tienes ubicación.
      
      Contenido disponible (JSON ligero): 
      ${JSON.stringify(contentForPrompt)}
      
      Afiliados disponibles: 
      ${JSON.stringify(affiliatesForPrompt)}

      Devuelve SOLO un array JSON válido con el orden final de IDs. No incluyas markdown, ni explicaciones.
      Formato esperado:
      [ { "id": "uuid", "type": "content" }, { "id": "uuid", "type": "affiliate" }, ... ]
    `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Limpieza básica del response por si Gemini incluye markdown blocks
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parsear el JSON que devuelve Gemini
        let feedOrder: { id: string, type: string }[] = [];
        try {
            feedOrder = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("Error parseando feed del Super Cerebro", e, "Response was:", cleanResponse);
            // Fallback: interleave simple
            return interleaveFallback(rawContent, affiliates);
        }

        // 3. Reconstruir el feed con los objetos completos
        const finalFeed = feedOrder.map(item => {
            if (item.type === 'affiliate') {
                const aff = affiliates?.find(a => a.id === item.id);
                return aff ? { ...aff, type: 'ad' } : null; // Mapeamos 'affiliate' a 'ad' para el frontend
            } else {
                const cont = rawContent?.find(c => c.id === item.id);
                return cont ? { ...cont, type: 'content' } : null;
            }
        }).filter(item => item !== null);

        // Si el feed generado es muy corto (error de Gemini o filtrado excesivo), rellenar con el resto
        if (finalFeed.length < 10 && rawContent && rawContent.length > 0) {
            console.log("Feed generado muy corto, rellenando con fallback.");
            const usedIds = new Set(finalFeed.map(i => i.id));
            const remaining = rawContent.filter(c => !usedIds.has(c.id));
            return [...finalFeed, ...remaining];
        }

        return finalFeed;

    } catch (err) {
        console.error("Error crítico en Super Cerebro:", err);
        // Fallback de emergencia: devolver rawContent tal cual
        return rawContent || [];
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
            result.push({ ...aff, type: 'ad' }); // 'ad' para frontend
            affIndex++;
        }
    }
    return result;
}
