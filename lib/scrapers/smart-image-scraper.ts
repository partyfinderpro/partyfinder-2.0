import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── SITIOS OBJETIVO ──
const AFFILIATE_SITES = [
    {
        name: 'Candy AI',
        urls: [
            'https://candy.ai',
            'https://candy.ai/es',
            'https://candy.ai/explore',
        ],
        category: 'ai_companion',
        click_url: 'https://candy.ai', // Will be appended with ?aff=venuz if needed
        position: 'hero'
    },
    {
        name: 'CamSoda',
        urls: [
            'https://www.camsoda.com',
            'https://www.camsoda.com/browse',
        ],
        category: 'webcam',
        click_url: 'https://camsoda.com/?aff=venuz',
        position: 'hero'
    },
    {
        name: 'Chaturbate',
        urls: [
            'https://chaturbate.com',
            'https://chaturbate.com/female-cams/',
        ],
        category: 'webcam',
        click_url: 'https://chaturbate.com',
        position: 'hero'
    },
    {
        name: 'Stripchat',
        urls: [
            'https://stripchat.com',
            'https://stripchat.com/girls',
        ],
        category: 'webcam',
        click_url: 'https://stripchat.com',
        position: 'hero'
    },
    {
        name: 'MyFreeCams',
        urls: [
            'https://www.myfreecams.com',
        ],
        category: 'webcam',
        click_url: 'https://www.myfreecams.com',
        position: 'hero'
    }
]

// ── DETECTOR DE CALIDAD DE IMAGEN ──
function scoreImage(url: string, width?: number, height?: number): number {
    let score = 0

    // Tamaño — imágenes grandes = mejor retención
    if (width && height) {
        const px = width * height
        if (px >= 1920 * 1080) score += 40
        else if (px >= 1280 * 720) score += 30
        else if (px >= 800 * 600) score += 20
        else if (px >= 400 * 300) score += 10
        else score -= 20 // muy pequeña, descartada
    }

    // Extensión — formatos de calidad
    if (url.includes('.webp')) score += 15
    else if (url.includes('.jpg') || url.includes('.jpeg')) score += 10
    else if (url.includes('.png')) score += 8
    else if (url.includes('.gif')) score -= 10 // GIFs = baja calidad visual

    // URLs que indican imágenes de banner/hero (alta retención)
    const highRetentionPatterns = [
        'hero', 'banner', 'cover', 'feature', 'promo',
        'model', 'girl', 'cam', 'live', 'og-image',
        'thumbnail', 'preview', 'profile'
    ]
    const lowRetentionPatterns = [
        'icon', 'logo', 'favicon', 'sprite', 'pixel',
        'tracking', '1x1', 'spacer', 'avatar-default'
    ]

    for (const pattern of highRetentionPatterns) {
        if (url.toLowerCase().includes(pattern)) { score += 10; break }
    }
    for (const pattern of lowRetentionPatterns) {
        if (url.toLowerCase().includes(pattern)) { score -= 30; break }
    }

    // CDN conocidos = imágenes optimizadas
    const cdnPatterns = ['cloudfront', 'cloudflare', 'akamai', 'imgix', 'fastly', 'cdn']
    for (const cdn of cdnPatterns) {
        if (url.includes(cdn)) { score += 10; break }
    }

    // URL con dimensiones explícitas (1920x, 800x, etc.) = alta calidad
    if (/\d{3,4}x\d{3,4}/.test(url)) score += 15
    if (/maxwidth=\d{3,4}/.test(url)) score += 10

    // Penalizar thumbnails pequeños
    if (/thumb|small|mini|tiny|50x|100x/.test(url)) score -= 15

    return Math.max(0, Math.min(100, score))
}

// ── EXTRACTOR DE IMÁGENES DE UNA PÁGINA ──
async function extractImagesFromPage(url: string): Promise<{ url: string, score: number }[]> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
            },
            signal: AbortSignal.timeout(15000)
        })

        if (!res.ok) return []
        const html = await res.text()

        const images: { url: string, score: number }[] = []
        const seen = new Set<string>()

        // 1. og:image y twitter:image (siempre de alta calidad)
        const metaPatterns = [
            /property="og:image"\s+content="([^"]+)"/gi,
            /name="twitter:image"\s+content="([^"]+)"/gi,
            /property="og:image:secure_url"\s+content="([^"]+)"/gi,
        ]
        for (const pattern of metaPatterns) {
            let m
            while ((m = pattern.exec(html)) !== null) {
                const imgUrl = m[1]
                if (!seen.has(imgUrl) && imgUrl.startsWith('http')) {
                    seen.add(imgUrl)
                    images.push({ url: imgUrl, score: scoreImage(imgUrl) + 25 }) // bonus por ser og:image
                }
            }
        }

        // 2. Todas las <img src> con srcset preferido
        const imgPattern = /<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"[^>]*(?:width="(\d+)")?[^>]*(?:height="(\d+)")?/gi
        let m
        while ((m = imgPattern.exec(html)) !== null) {
            const imgUrl = m[1].startsWith('http') ? m[1] : null
            if (imgUrl && !seen.has(imgUrl)) {
                seen.add(imgUrl)
                const w = m[2] ? parseInt(m[2]) : undefined
                const h = m[3] ? parseInt(m[3]) : undefined
                const score = scoreImage(imgUrl, w, h)
                if (score > 20) images.push({ url: imgUrl, score }) // solo las buenas
            }
        }

        // 3. CSS background-image URLs
        const bgPattern = /background-image:\s*url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi
        while ((m = bgPattern.exec(html)) !== null) {
            if (!seen.has(m[1])) {
                seen.add(m[1])
                const score = scoreImage(m[1])
                if (score > 20) images.push({ url: m[1], score })
            }
        }

        // Ordenar por score y devolver top 20
        return images.sort((a, b) => b.score - a.score).slice(0, 20)

    } catch (err) {
        console.error(`Error scraping ${url}:`, err)
        return []
    }
}

// ── SCRAPER PRINCIPAL ──
export async function runSmartImageScraper() {
    console.log('🤖 Iniciando Smart Image Scraper...')
    const results = { scraped: 0, saved: 0, banners: 0 }

    for (const site of AFFILIATE_SITES) {
        console.log(`\n📸 Scrapeando: ${site.name}`)
        const allImages: { url: string, score: number }[] = []

        for (const pageUrl of site.urls) {
            const images = await extractImagesFromPage(pageUrl)
            console.log(`  ${pageUrl}: ${images.length} imágenes encontradas`)
            allImages.push(...images)
            results.scraped += images.length
            // Pausa entre páginas para no ser bloqueado
            await new Promise(r => setTimeout(r, 2000))
        }

        if (allImages.length === 0) continue

        // Deduplicar y tomar las mejores
        const seen = new Set<string>()
        const unique = allImages
            .filter(img => { if (seen.has(img.url)) return false; seen.add(img.url); return true })
            .sort((a, b) => b.score - a.score)

        if (unique.length === 0) continue;

        const heroImage = unique[0] // la mejor imagen = banner principal
        const galleryUrls = unique.slice(0, 15).map(img => img.url) // top 15 para reciclar
        const avgScore = unique.slice(0, 5).reduce((s, i) => s + i.score, 0) / Math.min(unique.length, 5)

        // Guardar en scraped_items
        const { error } = await supabase.from('scraped_items').upsert({
            title: site.name,
            original_url: site.urls[0], // Usar primera URL como ID único lógico
            affiliate_url: site.click_url,
            hero_image_url: heroImage.url,
            gallery_urls: galleryUrls,
            category: site.category,
            item_type: 'affiliate_site',
            quality_score: Math.round(avgScore),
            elegance_score: Math.round(heroImage.score),
            feed_weight: avgScore / 100,
            is_approved: avgScore > 40,
            is_published: avgScore > 40,
            tags: [site.category, 'banner', 'affiliate'],
            vibe: ['premium', 'retention'],
        }, { onConflict: 'original_url' })

        if (error) {
            console.error(`Error saving scraped item for ${site.name}:`, error)
        } else {
            results.saved++
            console.log(`  ✅ ${site.name}: hero=${heroImage.score}pts, gallery=${galleryUrls.length} imgs`)
        }

        // Si calidad suficiente → agregar al banner rotativo
        if (heroImage.score > 40) {
            await supabase.from('banner_ads').upsert({
                title: site.name,
                image_url: heroImage.url,
                click_url: site.click_url,
                position: site.position,
                is_active: true,
                sort_order: AFFILIATE_SITES.indexOf(site)
            }, { onConflict: 'click_url' })
            results.banners++
        }

        // Pausa entre sitios
        await new Promise(r => setTimeout(r, 3000))
    }

    console.log(`\n✅ Scraper terminado:`, results)
    return results
}
