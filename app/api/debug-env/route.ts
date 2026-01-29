
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
