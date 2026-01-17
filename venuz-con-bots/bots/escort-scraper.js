/**
 * ============================================
 * VENUZ - ESCORT WEBSITES SCRAPER
 * ============================================
 * Scrapea sitios de escorts para Puerto Vallarta
 * Sitios: MilEroticos, Skokka, Locanto
 * ============================================
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración
const CONFIG = {
  MAX_PAGES: 5,           // Páginas por sitio
  MAX_ADS_PER_PAGE: 20,   // Anuncios por página
  DELAY_BETWEEN_REQUESTS: 2000, // 2 segundos entre requests
  TIMEOUT: 30000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Keywords para filtrar contenido de Puerto Vallarta
const PV_KEYWORDS = [
  'puerto vallarta', 'vallarta', 'zona romantica', 'romantic zone',
  'marina vallarta', 'hotel zone', 'jalisco', 'banderas bay',
  'nuevo vallarta', 'bucerias', 'sayulita', 'punta mita'
];

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verificar si el texto contiene keywords de PV
 */
function isPuertoVallarta(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PV_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Limpiar y normalizar teléfono
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return cleaned.slice(-10); // Últimos 10 dígitos
  }
  return null;
}

/**
 * Generar hash único para evitar duplicados
 */
function generateHash(name, phone, location) {
  const str = `${name || ''}-${phone || ''}-${location || ''}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * ============================================
 * SCRAPER: LOCANTO (Más fácil de scrapear)
 * ============================================
 */
async function scrapeLocanto(browser) {
  console.log('\n🔍 Scraping Locanto...');
  const results = [];
  
  const page = await browser.newPage();
  await page.setUserAgent(CONFIG.USER_AGENT);
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // URL de escorts en Jalisco/Puerto Vallarta
    const baseUrl = 'https://www.locanto.mx/Puerto-Vallarta/Servicios-Personales/Escorts/92/';
    
    for (let pageNum = 1; pageNum <= CONFIG.MAX_PAGES; pageNum++) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
      console.log(`  📄 Página ${pageNum}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);

        // Extraer listados
        const ads = await page.evaluate(() => {
          const items = [];
          const adElements = document.querySelectorAll('.bp_ad, .ad-listing, [class*="listing"]');
          
          adElements.forEach(ad => {
            const titleEl = ad.querySelector('h2 a, .ad-title a, [class*="title"] a');
            const imageEl = ad.querySelector('img');
            const locationEl = ad.querySelector('.location, [class*="location"]');
            const descEl = ad.querySelector('.description, [class*="desc"]');
            const linkEl = ad.querySelector('a[href*="/Escorts/"]');
            
            if (titleEl) {
              items.push({
                name: titleEl.textContent?.trim(),
                link: titleEl.href || linkEl?.href,
                image: imageEl?.src || imageEl?.dataset?.src,
                location: locationEl?.textContent?.trim(),
                description: descEl?.textContent?.trim(),
              });
            }
          });
          
          return items.slice(0, 20);
        });

        console.log(`    ✅ Encontrados: ${ads.length} anuncios`);

        // Procesar cada anuncio
        for (const ad of ads) {
          if (!ad.name || !ad.link) continue;
          
          // Verificar si es de PV
          const fullText = `${ad.name} ${ad.location} ${ad.description}`;
          if (!isPuertoVallarta(fullText) && !ad.link.includes('Puerto-Vallarta')) {
            continue;
          }

          // Visitar página del anuncio para más detalles
          try {
            await page.goto(ad.link, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
            await delay(1000);

            const details = await page.evaluate(() => {
              const phoneEl = document.querySelector('[class*="phone"], .phone-number, a[href^="tel:"]');
              const whatsappEl = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
              const imagesEls = document.querySelectorAll('.gallery img, .ad-images img, [class*="image"] img');
              const descFullEl = document.querySelector('.ad-description, .description, [class*="description"]');
              const ageEl = document.querySelector('[class*="age"]');
              
              const images = [];
              imagesEls.forEach(img => {
                const src = img.src || img.dataset?.src;
                if (src && !src.includes('placeholder')) {
                  images.push(src);
                }
              });

              // Extraer teléfono de WhatsApp link
              let whatsapp = null;
              if (whatsappEl) {
                const href = whatsappEl.href;
                const match = href.match(/(\d{10,})/);
                if (match) whatsapp = match[1];
              }

              return {
                phone: phoneEl?.textContent?.trim() || phoneEl?.href?.replace('tel:', ''),
                whatsapp,
                images: images.slice(0, 5),
                description: descFullEl?.textContent?.trim()?.slice(0, 500),
                age: ageEl?.textContent?.match(/\d+/)?.[0],
              };
            });

            results.push({
              name: ad.name,
              description: details.description || ad.description,
              category: 'escorts',
              subcategory: 'independiente',
              location: ad.location || 'Puerto Vallarta',
              phone: normalizePhone(details.phone),
              whatsapp: normalizePhone(details.whatsapp || details.phone),
              images: details.images.length > 0 ? details.images : (ad.image ? [ad.image] : []),
              age: details.age ? parseInt(details.age) : null,
              source: 'locanto',
              source_url: ad.link,
              scraped_at: new Date().toISOString(),
            });

          } catch (e) {
            console.log(`    ⚠️ Error en detalle: ${e.message}`);
          }
        }

      } catch (e) {
        console.log(`    ❌ Error página ${pageNum}: ${e.message}`);
      }
    }

  } catch (e) {
    console.error('❌ Error Locanto:', e.message);
  } finally {
    await page.close();
  }

  console.log(`  📊 Locanto total: ${results.length} escorts`);
  return results;
}

/**
 * ============================================
 * SCRAPER: SKOKKA
 * ============================================
 */
async function scrapeSkokka(browser) {
  console.log('\n🔍 Scraping Skokka...');
  const results = [];
  
  const page = await browser.newPage();
  await page.setUserAgent(CONFIG.USER_AGENT);
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const baseUrl = 'https://mx.skokka.com/escorts/jalisco/puerto-vallarta/';
    
    for (let pageNum = 1; pageNum <= CONFIG.MAX_PAGES; pageNum++) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}?p=${pageNum}`;
      console.log(`  📄 Página ${pageNum}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);

        const ads = await page.evaluate(() => {
          const items = [];
          const adElements = document.querySelectorAll('.aditem, .ad-item, [class*="ad-listing"]');
          
          adElements.forEach(ad => {
            const titleEl = ad.querySelector('.title a, h2 a, h3 a');
            const imageEl = ad.querySelector('img');
            const locationEl = ad.querySelector('.location, .city');
            const linkEl = titleEl || ad.querySelector('a');
            
            if (titleEl || linkEl) {
              items.push({
                name: titleEl?.textContent?.trim() || 'Escort PV',
                link: linkEl?.href,
                image: imageEl?.src || imageEl?.dataset?.src,
                location: locationEl?.textContent?.trim(),
              });
            }
          });
          
          return items.slice(0, 20);
        });

        console.log(`    ✅ Encontrados: ${ads.length} anuncios`);

        for (const ad of ads) {
          if (!ad.link) continue;
          
          try {
            await page.goto(ad.link, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
            await delay(1500);

            const details = await page.evaluate(() => {
              const phoneEl = document.querySelector('.phone, [class*="phone"], a[href^="tel:"]');
              const whatsappEl = document.querySelector('a[href*="wa.me"], .whatsapp');
              const imagesEls = document.querySelectorAll('.gallery img, .photos img, [class*="gallery"] img');
              const descEl = document.querySelector('.description, .ad-text, [class*="description"]');
              const priceEl = document.querySelector('.price, [class*="price"]');
              const ageEl = document.querySelector('[class*="age"], .edad');
              
              const images = [];
              imagesEls.forEach(img => {
                const src = img.src || img.dataset?.src || img.dataset?.lazy;
                if (src && !src.includes('placeholder') && !src.includes('avatar')) {
                  images.push(src);
                }
              });

              let whatsapp = null;
              if (whatsappEl?.href) {
                const match = whatsappEl.href.match(/(\d{10,})/);
                if (match) whatsapp = match[1];
              }

              return {
                phone: phoneEl?.textContent?.replace(/\D/g, '') || phoneEl?.href?.replace('tel:', '').replace(/\D/g, ''),
                whatsapp,
                images: images.slice(0, 5),
                description: descEl?.textContent?.trim()?.slice(0, 500),
                price: priceEl?.textContent?.trim(),
                age: ageEl?.textContent?.match(/\d+/)?.[0],
              };
            });

            results.push({
              name: ad.name,
              description: details.description,
              category: 'escorts',
              subcategory: 'independiente',
              location: ad.location || 'Puerto Vallarta',
              phone: normalizePhone(details.phone),
              whatsapp: normalizePhone(details.whatsapp || details.phone),
              images: details.images.length > 0 ? details.images : (ad.image ? [ad.image] : []),
              price: details.price,
              age: details.age ? parseInt(details.age) : null,
              source: 'skokka',
              source_url: ad.link,
              scraped_at: new Date().toISOString(),
            });

          } catch (e) {
            console.log(`    ⚠️ Error en detalle: ${e.message}`);
          }
        }

      } catch (e) {
        console.log(`    ❌ Error página ${pageNum}: ${e.message}`);
      }
    }

  } catch (e) {
    console.error('❌ Error Skokka:', e.message);
  } finally {
    await page.close();
  }

  console.log(`  📊 Skokka total: ${results.length} escorts`);
  return results;
}

/**
 * ============================================
 * SCRAPER: MILEROTICOS
 * ============================================
 */
async function scrapeMilEroticos(browser) {
  console.log('\n🔍 Scraping MilEroticos...');
  const results = [];
  
  const page = await browser.newPage();
  await page.setUserAgent(CONFIG.USER_AGENT);
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const baseUrl = 'https://www.mileroticos.com/escorts/puerto-vallarta';
    
    for (let pageNum = 1; pageNum <= CONFIG.MAX_PAGES; pageNum++) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
      console.log(`  📄 Página ${pageNum}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);

        const ads = await page.evaluate(() => {
          const items = [];
          const adElements = document.querySelectorAll('.gridAd, .ad-card, [class*="ad-item"]');
          
          adElements.forEach(ad => {
            const titleEl = ad.querySelector('.title, h2, h3');
            const imageEl = ad.querySelector('img');
            const linkEl = ad.querySelector('a');
            const locationEl = ad.querySelector('.location, .zona');
            
            if (linkEl) {
              items.push({
                name: titleEl?.textContent?.trim() || 'Escort',
                link: linkEl.href,
                image: imageEl?.src || imageEl?.dataset?.src,
                location: locationEl?.textContent?.trim(),
              });
            }
          });
          
          return items.slice(0, 20);
        });

        console.log(`    ✅ Encontrados: ${ads.length} anuncios`);

        for (const ad of ads) {
          if (!ad.link) continue;
          
          try {
            await page.goto(ad.link, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT });
            await delay(1500);

            const details = await page.evaluate(() => {
              const phoneEl = document.querySelector('.phone, [class*="telefono"], a[href^="tel:"]');
              const whatsappEl = document.querySelector('a[href*="wa.me"], [class*="whatsapp"]');
              const imagesEls = document.querySelectorAll('.gallery img, .fotos img, [class*="photo"] img');
              const descEl = document.querySelector('.description, .texto, [class*="desc"]');
              const priceEl = document.querySelector('.tarifa, .price, [class*="precio"]');
              const ageEl = document.querySelector('.edad, [class*="age"]');
              const servicesEl = document.querySelector('.servicios, [class*="services"]');
              
              const images = [];
              imagesEls.forEach(img => {
                const src = img.src || img.dataset?.src;
                if (src && !src.includes('placeholder')) {
                  images.push(src);
                }
              });

              let whatsapp = null;
              if (whatsappEl?.href) {
                const match = whatsappEl.href.match(/(\d{10,})/);
                if (match) whatsapp = match[1];
              }

              return {
                phone: phoneEl?.textContent?.replace(/\D/g, ''),
                whatsapp,
                images: images.slice(0, 5),
                description: descEl?.textContent?.trim()?.slice(0, 500),
                price: priceEl?.textContent?.trim(),
                age: ageEl?.textContent?.match(/\d+/)?.[0],
                services: servicesEl?.textContent?.trim(),
              };
            });

            results.push({
              name: ad.name,
              description: details.description,
              category: 'escorts',
              subcategory: 'independiente',
              location: ad.location || 'Puerto Vallarta',
              phone: normalizePhone(details.phone),
              whatsapp: normalizePhone(details.whatsapp || details.phone),
              images: details.images.length > 0 ? details.images : (ad.image ? [ad.image] : []),
              price: details.price,
              age: details.age ? parseInt(details.age) : null,
              services: details.services,
              source: 'mileroticos',
              source_url: ad.link,
              scraped_at: new Date().toISOString(),
            });

          } catch (e) {
            console.log(`    ⚠️ Error en detalle: ${e.message}`);
          }
        }

      } catch (e) {
        console.log(`    ❌ Error página ${pageNum}: ${e.message}`);
      }
    }

  } catch (e) {
    console.error('❌ Error MilEroticos:', e.message);
  } finally {
    await page.close();
  }

  console.log(`  📊 MilEroticos total: ${results.length} escorts`);
  return results;
}

/**
 * ============================================
 * GUARDAR EN SUPABASE
 * ============================================
 */
async function saveToSupabase(escorts) {
  console.log('\n💾 Guardando en Supabase...');
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const escort of escorts) {
    try {
      // Generar hash para deduplicación
      const hash = generateHash(escort.name, escort.phone, escort.location);
      
      // Preparar datos para insertar
      const data = {
        name: escort.name || 'Escort PV',
        slug: `escort-${hash}`,
        description: escort.description || `Servicio de acompañante en ${escort.location || 'Puerto Vallarta'}`,
        category: 'escorts',
        subcategory: escort.subcategory || 'independiente',
        address: escort.location || 'Puerto Vallarta, Jalisco',
        city: 'Puerto Vallarta',
        state: 'Jalisco',
        country: 'Mexico',
        latitude: 20.6534 + (Math.random() - 0.5) * 0.05, // Randomize slightly for privacy
        longitude: -105.2253 + (Math.random() - 0.5) * 0.05,
        phone: escort.phone,
        whatsapp: escort.whatsapp || escort.phone,
        image_url: escort.images?.[0] || null,
        images: escort.images || [],
        price_range: escort.price || null,
        age: escort.age || null,
        services: escort.services || null,
        source: escort.source,
        source_url: escort.source_url,
        is_verified: false,
        is_active: true,
        is_available_now: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_scraped: escort.scraped_at,
      };

      // Upsert: Insertar o actualizar si existe
      const { error } = await supabase
        .from('content')
        .upsert(data, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        });

      if (error) {
        // Si falla por slug, intentar con source_url
        const { error: error2 } = await supabase
          .from('content')
          .upsert({
            ...data,
            slug: `escort-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });
        
        if (error2) {
          console.log(`    ⚠️ Error guardando ${escort.name}: ${error2.message}`);
          errors++;
        } else {
          inserted++;
        }
      } else {
        inserted++;
      }

    } catch (e) {
      console.log(`    ❌ Error: ${e.message}`);
      errors++;
    }
  }

  console.log(`  ✅ Insertados/Actualizados: ${inserted}`);
  console.log(`  ❌ Errores: ${errors}`);
  
  return { inserted, updated, errors };
}

/**
 * ============================================
 * MAIN
 * ============================================
 */
async function main() {
  console.log('🚀 VENUZ Escort Scraper iniciando...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  // Verificar variables de entorno
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Iniciar browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  try {
    let allEscorts = [];

    // Scrapear cada sitio
    const locantoResults = await scrapeLocanto(browser);
    allEscorts = [...allEscorts, ...locantoResults];

    const skokkaResults = await scrapeSkokka(browser);
    allEscorts = [...allEscorts, ...skokkaResults];

    const milEroticosResults = await scrapeMilEroticos(browser);
    allEscorts = [...allEscorts, ...milEroticosResults];

    console.log(`\n📊 TOTAL SCRAPEADO: ${allEscorts.length} escorts`);

    // Guardar en Supabase
    if (allEscorts.length > 0) {
      await saveToSupabase(allEscorts);
    }

  } catch (e) {
    console.error('❌ Error fatal:', e);
  } finally {
    await browser.close();
  }

  console.log('\n✅ Scraper finalizado');
}

// Ejecutar
main().catch(console.error);
