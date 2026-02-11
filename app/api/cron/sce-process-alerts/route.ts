
import { NextResponse } from 'next/server';
import { processAlerts } from '@/lib/sce/alert-system';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await processAlerts();

        return NextResponse.json({ success: true, message: 'Alert processing completed' });
    } catch (error: any) {
        console.error('Error processing alerts:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
