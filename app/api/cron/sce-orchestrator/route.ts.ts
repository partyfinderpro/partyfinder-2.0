// app/api/cron/sce-orchestrator/route.ts
import { NextResponse } from 'next/server';
import { runGobiernoBrain } from '@/lib/sce/brain-gobierno';

export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Seguridad: verificar cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🚀 SCE ORCHESTRATOR - Iniciado');
  const startTime = Date.now();

  try {
    // Ejecutar cerebros en paralelo
    const results = await Promise.allSettled([
      runGobiernoBrain(),
      // runSocialBrain(),     // TODO: Implementar
      // runVenuesBrain(),     // TODO: Implementar
      // runAggregatorsBrain() // TODO: Implementar
    ]);

    const duration = Date.now() - startTime;

    const summary = {
      status: 'completed',
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      results: results.map((result, index) => ({
        brain: ['gobierno', 'social', 'venues', 'aggregators'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
      })),
    };

    console.log('✅ SCE ORCHESTRATOR completado:', summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ Error crítico en SCE:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
