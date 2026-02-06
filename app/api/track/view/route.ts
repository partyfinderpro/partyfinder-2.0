// app/api/track/view/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Lazy init para evitar errores de build
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('id');

    if (!contentId) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        const supabase = getSupabase();

        // Intentar usar la función RPC primero
        const { error: rpcError } = await supabase.rpc('increment_preview_views', {
            content_id: contentId
        });

        // Si RPC falla, hacer update directo
        if (rpcError) {
            console.warn('RPC failed, using direct update:', rpcError.message);

            const { error: updateError } = await supabase
                .from('content')
                .update({
                    preview_views: supabase.rpc('increment', { row_id: contentId })
                })
                .eq('id', contentId);

            // Si update también falla, intentar incremento manual
            if (updateError) {
                const { data: current } = await supabase
                    .from('content')
                    .select('preview_views')
                    .eq('id', contentId)
                    .single();

                if (current) {
                    await supabase
                        .from('content')
                        .update({ preview_views: (current.preview_views || 0) + 1 })
                        .eq('id', contentId);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Track view error:', error);
        // No retornar error al cliente para no afectar UX
        return NextResponse.json({ success: false });
    }
}
