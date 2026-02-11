// app/api/cron/sce-health-check/route.ts
import { NextResponse } from 'next/server';
import { runHealthCheck } from '@/lib/sce/health-monitor';
import { processAlerts } from '@/lib/sce/alert-system';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🏥 SCE Health Check - Iniciado');

  try {
    const healthResult = await runHealthCheck();
    await processAlerts();

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      result: healthResult,
    });

  } catch (error: any) {
    console.error('❌ Error en health check:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
