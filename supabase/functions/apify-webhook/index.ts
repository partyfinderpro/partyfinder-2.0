import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://jbrmziwosyeructvlvrq.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const APIFY_WEBHOOK_SECRET = Deno.env.get("APIFY_WEBHOOK_SECRET") || "";

serve(async (req: Request) => {
    // Solo permitir POST
    if (req.method !== "POST") {
        return new Response("Metodo no permitido", { status: 405 });
    }

    // Validacion de secret (opcional pero recomendado)
    const apifySecret = req.headers.get("x-apify-secret");
    if (APIFY_WEBHOOK_SECRET && apifySecret !== APIFY_WEBHOOK_SECRET) {
        console.error("Webhook secreto invalido");
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const payload = await req.json();
        console.log("Payload recibido de Apify:", JSON.stringify(payload));

        // Apify normalmente envia los items en datasetItems o resource.defaultDatasetId items
        const items = payload.datasetItems || payload.items || [];

        if (items.length === 0) {
            console.log("No hay items en el payload");
            return new Response("No hay datos para procesar", { status: 200 });
        }

        const upsertData = [];

        for (const item of items) {
            // Detectar tipo de scraper y transformar
            const transformed = transformItem(item);
            if (transformed) {
                upsertData.push(transformed);
            }
        }

        if (upsertData.length > 0) {
            // Upsert masivo (requiere unique constraint en source_url)
            const { error } = await supabase
                .from("content")
                .upsert(upsertData, { onConflict: "source_url" });

            if (error) {
                console.error("Error al insertar/upsert en Supabase:", error);
                return new Response("Error: " + error.message, { status: 500 });
            }

            console.log("Se insertaron/actualizaron " + upsertData.length + " registros");
        }

        return new Response("Datos procesados correctamente", { status: 200 });
    } catch (err) {
        console.error("Error procesando webhook:", err);
        return new Response("Error interno del servidor", { status: 500 });
    }
});

// Funcion de transformacion y categorizacion automatica
function transformItem(item: any) {
    // Detectar si es Instagram (por campos tipicos del Instagram Scraper de Apify)
    if (item.url && item.url.includes("instagram.com")) {
        return {
            title: item.caption ? item.caption.slice(0, 100) : item.ownerUsername || "Post de Instagram",
            description: item.caption || "",
            image_url: item.displayUrl || item.imageUrl || null,
            video_url: item.videoUrl || null,
            category: categorizeInstagram(item),
            location: item.locationName || "Puerto Vallarta",
            source_url: item.url,
            created_at: new Date().toISOString(),
        };
    }

    // Detectar si es Google Maps / Places (por campos tipicos del Google Maps Scraper)
    if (item.placeId || (item.url && item.url.includes("google.com/maps"))) {
        return {
            title: item.title || item.name || "Lugar en Puerto Vallarta",
            description: item.editorialSummary?.text || item.description || "",
            image_url: item.photos?.[0]?.photoUrl || null,
            video_url: null,
            category: categorizeGooglePlace(item),
            location: item.address || item.location?.address || "Puerto Vallarta",
            source_url: item.url || item.website || "https://www.google.com/maps/place/?q=place_id:" + item.placeId,
            created_at: new Date().toISOString(),
        };
    }

    console.log("Item no reconocido, se ignora:", item);
    return null;
}

// Categorizacion automatica para Instagram
function categorizeInstagram(item: any): string {
    const text = ((item.caption || "") + " " + (item.ownerUsername || "")).toLowerCase();
    if (text.includes("strip") || text.includes("gentlemen") || text.includes("adult")) return "Entretenimiento Adulto";
    if (text.includes("club") || text.includes("nightclub") || text.includes("fiesta")) return "Club Nocturno";
    if (text.includes("bar") || text.includes("zona romantica")) return "Bar";
    if (text.includes("event") || text.includes("party")) return "Evento/Fiesta";
    return "Social Media";
}

// Categorizacion automatica para Google Places
function categorizeGooglePlace(item: any): string {
    const types = item.types || [];
    if (types.includes("night_club")) return "Club Nocturno";
    if (types.includes("bar")) return "Bar";
    if (types.includes("adult_entertainment_store") || types.includes("strip_club")) return "Entretenimiento Adulto";
    if (types.includes("restaurant")) return "Restaurante/Bar";
    return "Lugar de Interes";
}
