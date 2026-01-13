/**
 * PROYECTO VENUZ - Facebook Events Scraper
 * Fase 2: Antigravity - Scraping Automatizado de Eventos
 * 
 * @description Scraper resiliente para eventos de Facebook usando Playwright
 * @author Pablovichk
 * @version 1.0.0
 */

const { chromium } = require('playwright');

/**
 * Configuración del scraper
 */
const CONFIG = {
    MAX_RETRIES: 3,
    TIMEOUT: 30000,
    SCROLL_DELAY: 2000,
    MAX_EVENTS: 20,
    USER_AGENTS: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
};

/**
 * Espera aleatoria para simular comportamiento humano
 */
const randomDelay = (min = 1000, max = 3000) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
};

/**
 * Scroll suave para cargar contenido dinámico
 */
async function smoothScroll(page, scrolls = 3) {
    for (let i = 0; i < scrolls; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 0.8);
        });
        await randomDelay(1500, 2500);
    }
}

/**
 * Extrae información de un evento individual
 */
function extractEventData(element) {
    try {
        const titleElement = element.querySelector('a[href*="/events/"]');
        const dateElement = element.querySelector('[aria-label*="date"], [aria-label*="fecha"], span[dir="auto"]');
        const locationElement = element.querySelector('[aria-label*="location"], [aria-label*="ubicación"]');

        // Buscar múltiples selectores para descripción
        const descriptionElement = element.querySelector('div[dir="auto"]') ||
            element.querySelector('[data-ad-preview="message"]') ||
            element.querySelector('span[dir="auto"]');

        return {
            title: titleElement?.textContent?.trim() || 'Sin título',
            url: titleElement?.href || null,
            date: dateElement?.textContent?.trim() || 'Fecha no disponible',
            location: locationElement?.textContent?.trim() || 'Ubicación no especificada',
            description: descriptionElement?.textContent?.trim()?.slice(0, 200) || 'Sin descripción',
            scraped_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error extrayendo datos del evento:', error.message);
        return null;
    }
}

/**
 * Scraper principal de Facebook Events
 * 
 * @param {string} searchQuery - Término de búsqueda (ej: "Fiestas patronales Puerto Vallarta")
 * @param {string} location - Ciudad/ubicación para filtrar resultados
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} Array de eventos encontrados
 */
async function scrapeFacebookEvents(searchQuery, location, options = {}) {
    const {
        maxEvents = CONFIG.MAX_EVENTS,
        headless = true,
        retries = CONFIG.MAX_RETRIES
    } = options;

    let browser;
    let attempt = 0;

    while (attempt < retries) {
        try {
            console.log(`🔍 Intento ${attempt + 1}/${retries}: Buscando eventos de Facebook...`);

            // Lanzar navegador con configuración stealth
            browser = await chromium.launch({
                headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920x1080',
                    '--disable-blink-features=AutomationControlled'
                ]
            });

            // Crear contexto con user agent aleatorio
            const userAgent = CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
            const context = await browser.newContext({
                userAgent,
                viewport: { width: 1920, height: 1080 },
                locale: 'es-MX',
                timezoneId: 'America/Mexico_City',
                permissions: ['geolocation']
            });

            const page = await context.newPage();

            // Ocultar webdriver
            await page.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });
            });

            // Construir URL de búsqueda de eventos
            const encodedQuery = encodeURIComponent(`${searchQuery} ${location}`);
            const searchUrl = `https://www.facebook.com/events/search/?q=${encodedQuery}`;

            console.log(`📍 Navegando a: ${searchUrl}`);

            await page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.TIMEOUT
            });

            // Esperar carga inicial
            await randomDelay(3000, 5000);

            // Scroll para cargar más eventos
            await smoothScroll(page, 3);

            // Esperar a que se carguen los eventos
            await page.waitForSelector('[role="article"], [role="main"]', {
                timeout: CONFIG.TIMEOUT
            }).catch(() => {
                console.warn('⚠️ No se encontró contenedor de eventos, continuando...');
            });

            // Extraer eventos usando evaluación en el navegador
            const events = await page.evaluate((maxEventsLimit) => {
                const eventElements = [];
                const results = [];

                // Múltiples selectores para encontrar eventos
                const selectors = [
                    'a[href*="/events/"][role="link"]',
                    'div[role="article"]',
                    '[data-pagelet*="Event"]'
                ];

                // Intentar con cada selector
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        eventElements.push(...Array.from(elements));
                        break;
                    }
                }

                // Procesar cada elemento encontrado
                const uniqueUrls = new Set();

                for (const element of eventElements) {
                    if (results.length >= maxEventsLimit) break;

                    try {
                        const linkElement = element.querySelector('a[href*="/events/"]') ||
                            (element.tagName === 'A' ? element : null);

                        if (!linkElement) continue;

                        const eventUrl = linkElement.href;

                        // Evitar duplicados
                        if (uniqueUrls.has(eventUrl)) continue;
                        uniqueUrls.add(eventUrl);

                        // Obtener contenedor del evento
                        const container = element.closest('div[role="article"]') ||
                            element.closest('div') ||
                            element;

                        // Extraer información
                        const titleEl = linkElement.querySelector('span') || linkElement;
                        const title = titleEl?.textContent?.trim();

                        if (!title || title.length < 3) continue;

                        // Buscar fecha en el contenedor
                        const allText = container.textContent || '';
                        const dateMatch = allText.match(/(\d{1,2}\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);

                        // Buscar ubicación
                        const locationMatch = allText.match(/(?:en|at)\s+([^·•\n]{3,50})/i);

                        results.push({
                            title: title,
                            url: eventUrl.split('?')[0], // Limpiar parámetros
                            date: dateMatch ? dateMatch[0] : 'Fecha no disponible',
                            location: locationMatch ? locationMatch[1].trim() : 'Ubicación no especificada',
                            description: allText.slice(0, 200).replace(/\s+/g, ' ').trim(),
                            scraped_at: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error('Error procesando evento:', err);
                    }
                }

                return results;
            }, maxEvents);

            await browser.close();

            // Validar resultados
            if (!events || events.length === 0) {
                throw new Error('No se encontraron eventos');
            }

            console.log(`✅ Scraping exitoso: ${events.length} eventos encontrados`);

            // Filtrar y limpiar resultados
            const cleanedEvents = events
                .filter(event => event.url && event.title)
                .map(event => ({
                    ...event,
                    source: 'facebook',
                    search_query: searchQuery,
                    search_location: location
                }));

            return cleanedEvents;

        } catch (error) {
            console.error(`❌ Error en intento ${attempt + 1}:`, error.message);

            if (browser) {
                await browser.close().catch(() => { });
            }

            attempt++;

            if (attempt >= retries) {
                console.error('🚫 Máximo de reintentos alcanzado');
                throw new Error(`Scraping fallido después de ${retries} intentos: ${error.message}`);
            }

            // Esperar antes de reintentar
            await randomDelay(3000, 5000);
        }
    }
}

/**
 * Función wrapper para uso en GitHub Actions o Vercel
 */
async function scrapeAndSave(searchQuery, location, options = {}) {
    try {
        console.log('🚀 Iniciando scraper de Facebook Events...');
        console.log(`   Búsqueda: "${searchQuery}"`);
        console.log(`   Ubicación: "${location}"`);

        const events = await scrapeFacebookEvents(searchQuery, location, options);

        console.log(`\n📊 Resultados:`);
        console.log(`   Total eventos: ${events.length}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);

        return {
            success: true,
            count: events.length,
            events: events,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('💥 Error fatal en scraper:', error);

        return {
            success: false,
            error: error.message,
            count: 0,
            events: [],
            timestamp: new Date().toISOString()
        };
    }
}

// Exportar funciones
module.exports = {
    scrapeFacebookEvents,
    scrapeAndSave
};

// Permitir ejecución directa desde CLI
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Uso: node facebook-events-scraper.js "<búsqueda>" "<ubicación>"');
        console.log('Ejemplo: node facebook-events-scraper.js "Fiestas patronales" "Puerto Vallarta"');
        process.exit(1);
    }

    const [searchQuery, location] = args;

    scrapeAndSave(searchQuery, location, { headless: false })
        .then(result => {
            console.log('\n' + '='.repeat(50));
            console.log('RESULTADOS FINALES:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}
