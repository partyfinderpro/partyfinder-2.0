import { NextResponse } from 'next/server'
import { runSmartImageScraper } from '@/lib/scrapers/smart-image-scraper'

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const results = await runSmartImageScraper()
        return NextResponse.json({ success: true, ...results })
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
