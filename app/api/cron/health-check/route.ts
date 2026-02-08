import { NextResponse } from 'next/server';

export const runtime = 'edge';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://partyfinder-2-0.vercel.app';

export async function GET() {
    try {
        // Llamada interna al health endpoint para centralizar lógica
        const healthRes = await fetch(`${APP_URL}/api/health`);

        if (!healthRes.ok) {
            throw new Error(`Health API returned ${healthRes.status}`);
        }

        const healthData = await healthRes.json();

        // Auto-healing simple logic could go here if needed
        // Por ahora el endpoint /api/health ya maneja alertas y logging

        return NextResponse.json({
            success: true,
            checked_at: new Date().toISOString(),
            data: healthData
        });

    } catch (error: any) {
        console.error('Health cron failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
