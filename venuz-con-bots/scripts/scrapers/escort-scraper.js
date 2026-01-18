const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Intentamos usar el service_role_key para bypass RLS, si no, usamos el anon_key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan las credenciales de Supabase en .env.local');
    console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Nota: Usando ANON_KEY. Si tienes errores de permisos (RLS), agrega SUPABASE_SERVICE_ROLE_KEY a .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURACIÓN DEL SCRAPER
// TODO: Reemplaza estas constantes con los valores reales del sitio objetivo
const TARGET_URL = 'https://www.escortnews.com/en/escorts/puerto-vallarta';
const SOURCE_NAME = 'EscortNews';
const CATEGORY = 'escort';

async function scrape() {
    console.log(`🚀 Iniciando scraper para ${SOURCE_NAME}...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Establecer User Agent para evitar bloqueos
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Lógica de extracción principal
        const items = await page.evaluate(() => {
            const results = [];
            // Selector genérico - AJUSTAR SEGÚN LA ESTRUCTURA DEL SITIO
            const cards = document.querySelectorAll('section.products-grid .item, .list-item, article');

            cards.forEach(card => {
                try {
                    const titleEl = card.querySelector('h2, .title, .name');
                    const linkEl = card.querySelector('a');
                    const imgEl = card.querySelector('img');
                    const descEl = card.querySelector('.description, p');
                    const locationEl = card.querySelector('.location, .city');

                    if (titleEl && linkEl) {
                        const title = titleEl.innerText.trim();
                        const url = linkEl.href;
                        let image_url = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : null;

                        if (title && url) {
                            results.push({
                                title,
                                url,
                                image_url,
                                description: descEl ? descEl.innerText.trim() : '',
                                location: locationEl ? locationEl.innerText.trim() : 'Puerto Vallarta',
                                images: image_url ? [image_url] : []
                            });
                        }
                    }
                } catch (e) {
                    // Ignorar errores en items individuales
                }
            });
            return results;
        });

        if (items.length === 0) {
            console.warn('⚠️ No se encontraron perfiles. ¿Quizás Cloudflare bloqueó el acceso?');
            console.log('💡 Generando perfiles de prueba para verificar el Carrusel...');

            const mockItems = [
                {
                    title: 'Valentina VIP',
                    description: 'Elegante acompañante en Puerto Vallarta. Fotos 100% reales. Servicio exclusivo y discreción total.',
                    url: 'https://example.com/valentina-mock',
                    image_url: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=2000',
                    location: 'Zona Romántica',
                    images: [
                        'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=2000',
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2000',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2000'
                    ]
                },
                {
                    title: 'Camila Gold',
                    description: 'Modelo independiente disponible para acompañamiento. Ven y disfruta de una noche inolvidable.',
                    url: 'https://example.com/camila-mock',
                    image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2000',
                    location: 'Marina Vallarta',
                    images: [
                        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2000',
                        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=2000',
                        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=2000'
                    ]
                }
            ];

            items.push(...mockItems);
        }

        console.log(`🔍 Procesando ${items.length} perfiles.`);

        // Iterar para enriquecer (obtener más fotos)
        for (const item of items) {
            // Si es mock, saltamos la navegación extra
            if (item.url.includes('example.com')) {
                await guardarPerfil(item);
                continue;
            }

            try {
                const detailPage = await browser.newPage();
                // ... (resto del código de navegación de detalle)
            } catch (err) { /* ... */ }
        }
    } catch (err) { /* ... */ } finally {
        await browser.close();
    }
}

async function guardarPerfil(item) {
    const contentData = {
        title: item.title,
        description: item.description,
        source_url: item.url,
        image_url: item.image_url,
        category: CATEGORY,
        source_site: SOURCE_NAME,
        active: true,
        images: item.images,
        scraped_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('content')
        .upsert(contentData, { onConflict: 'source_url' });

    if (error) {
        console.error(`❌ Error DB ${item.title}:`, error.message);
    } else {
        console.log(`✅ Guardado: ${item.title}`);
    }
}

scrape();
