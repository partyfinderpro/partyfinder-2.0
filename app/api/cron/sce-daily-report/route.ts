// app/api/cron/sce-daily-report/route.ts
import { NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/sce/alert-system';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📊 SCE Daily Report - Iniciado');

  try {
    await sendDailyReport();

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error en reporte diario:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
