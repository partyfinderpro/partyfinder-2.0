
import { NextResponse } from 'next/server'
import { scrapeSkokka, saveEscortsToContent } from '@/lib/scrapers/escort-scraper'

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET() {
    try {
        console.log('🔴 [CRON] Iniciando scrape manual de escorts PV...')

        const listings = await scrapeSkokka()
        console.log(`[CRON] Encontrados: ${listings.length} listings`)

        const saved = await saveEscortsToContent(listings)
        console.log(`[CRON] Guardados: ${saved} nuevos`)

        return NextResponse.json({
            success: true,
            found: listings.length,
            saved,
            message: `Scrape completado. ${saved} escorts nuevas agregadas a la base de datos.`
        })
    } catch (error: any) {
        console.error('[CRON] Error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 })
    }
}
