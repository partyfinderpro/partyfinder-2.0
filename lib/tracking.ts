// /lib/tracking.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY! // Tracking uses anon key usually or specific proxy
)

// We might need a separate client for service role if we want to bypass RLS for stats
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function trackEngagement(data: {
    deviceId: string
    itemId: string
    categorySlug: string
    sessionId: string
    timeSpent: number      // Segundos en el item
    completionPct: number  // % del video/contenido visto
    clicked: boolean       // Click a detalle/afiliado
    saved: boolean
    shared: boolean
    userId?: string
}) {
    const skipped = data.timeSpent < 3 // Menos de 3s = skip

    try {
        // Upsert engagement record
        const { error: engagementError } = await supabase.from('user_engagement').upsert({
            user_id: data.userId || null,
            device_id: data.deviceId,
            item_id: data.itemId,
            category_slug: data.categorySlug,
            session_id: data.sessionId,
            time_spent: data.timeSpent,
            completion_pct: data.completionPct,
            clicked: data.clicked,
            saved: data.saved,
            shared: data.shared,
            skipped
        }, {
            onConflict: 'device_id,item_id,session_id'
        })

        if (engagementError) {
            console.error('[Tracking] Engagement Error:', engagementError)
        }

        // Actualizar stats globales del item via RPC
        const { error: rpcError } = await supabaseAdmin.rpc('update_item_stats', {
            p_item_id: data.itemId,
            p_time_spent: data.timeSpent,
            p_clicked: data.clicked
        })

        if (rpcError) {
            console.error('[Tracking] RPC Error:', rpcError)
        }
    } catch (err) {
        console.error('[Tracking] Global Error:', err)
    }
}
