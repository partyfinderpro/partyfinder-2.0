import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const linkId = url.searchParams.get("id");

        if (!linkId) {
            return new Response(JSON.stringify({ error: "Missing id parameter" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Obtener el link
        const { data: link, error: fetchError } = await supabase
            .from("affiliate_links")
            .select("affiliate_url, is_active")
            .eq("id", linkId)
            .single();

        if (fetchError || !link) {
            return new Response(JSON.stringify({ error: "Link not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!link.is_active) {
            return new Response(JSON.stringify({ error: "Link inactive" }), {
                status: 410,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Registrar el click
        const clickData = {
            link_id: linkId,
            clicked_at: new Date().toISOString(),
            user_agent: req.headers.get("user-agent") || "unknown",
            ip: req.headers.get("x-forwarded-for") || "unknown",
        };

        // Usar tracking si existe la tabla, si no, al menos incrementamos contador
        try {
            await supabase.from("affiliate_conversions").insert(clickData);
        } catch (e) {
            console.warn("Table affiliate_conversions might not exist yet:", e);
        }

        // Incrementar contador
        const { error: updateError } = await supabase.rpc('increment_affiliate_clicks', {
            row_id: linkId
        });

        // Si el RPC falla (no existe), intentamos update normal
        if (updateError) {
            await supabase
                .from("affiliate_links")
                .update({ clicks_count: (link as any).clicks_count + 1 })
                .eq("id", linkId);
        }

        // Redirigir
        return Response.redirect(link.affiliate_url, 302);
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
