// ============================================================
// VENUZ - Script para poblar la base de datos con contenido
// Ejecutar: node scripts/seed-content.js
// ============================================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno de Supabase no configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// CONTENIDO DE EJEMPLO PARA DIFERENTES CATEGORÍAS
// ============================================================

const SEED_CONTENT = [
    // CLUBS
    {
        title: "Noche Latina @ Club Mandala",
        description: "La mejor fiesta latina de Puerto Vallarta con DJ internacional. Música en vivo hasta las 4AM.",
        image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
        category: "club",
        subcategory: "disco",
        location: "Zona Romántica, Puerto Vallarta",
        is_verified: true,
        is_open_now: true,
        open_until: "4:00 AM",
        views: 1523,
        likes: 234,
        tags: ["latino", "dj", "fiesta", "nightlife"]
    },
    {
        title: "Zoo Men's Club",
        description: "El club de caballeros más exclusivo de Guadalajara. Shows en vivo todas las noches.",
        image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        category: "club",
        subcategory: "gentleman",
        location: "Zona Rosa, Guadalajara",
        is_verified: true,
        is_premium: true,
        is_open_now: true,
        open_until: "5:00 AM",
        views: 2891,
        likes: 445,
        tags: ["vip", "exclusivo", "shows"]
    },

    // ESCORTS
    {
        title: "Valentina - Modelo Premium",
        description: "Servicio VIP disponible 24/7. Atención a hoteles y domicilios. Fotos 100% verificadas.",
        image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
        category: "escort",
        subcategory: "premium",
        location: "Hotel Zone, Cancún",
        is_verified: true,
        is_premium: true,
        views: 5421,
        likes: 892,
        tags: ["vip", "24hrs", "verificada", "premium"]
    },
    {
        title: "Sofía - Escort Independiente",
        description: "Chica universitaria, trato de novia, servicio completo. Solo caballeros serios.",
        image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
        category: "escort",
        subcategory: "independiente",
        location: "Roma Norte, CDMX",
        is_verified: true,
        views: 3421,
        likes: 567,
        tags: ["universitaria", "independiente", "GFE"]
    },

    // LIVE CAMS (Affiliates)
    {
        title: "Luna - En Vivo Ahora",
        description: "🔴 LIVE - Show especial de viernes noche. Únete a la transmisión.",
        image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
        category: "live",
        subcategory: "cams",
        affiliate_url: "https://www.camsoda.com/?refId=venuz",
        affiliate_source: "camsoda",
        is_verified: true,
        is_premium: true,
        views: 8967,
        likes: 2341,
        viewers_now: 847,
        tags: ["live", "show", "premium"]
    },
    {
        title: "Camila - Stripchat Live",
        description: "💋 Online ahora - Show privado disponible. Latina caliente.",
        image_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80",
        category: "live",
        subcategory: "cams",
        affiliate_url: "https://stripchat.com/?refId=venuz",
        affiliate_source: "stripchat",
        is_verified: true,
        views: 6543,
        likes: 1876,
        viewers_now: 523,
        tags: ["latina", "privado", "online"]
    },

    // BARES
    {
        title: "La Cantina del Pancho",
        description: "Mezcales artesanales y coctelería mexicana de autor. El mejor mezcal de Oaxaca.",
        image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
        category: "bar",
        subcategory: "mezcaleria",
        location: "5 de Diciembre, Puerto Vallarta",
        is_verified: true,
        is_open_now: true,
        open_until: "2:00 AM",
        views: 445,
        likes: 89,
        tags: ["mezcal", "cocteleria", "mexicano"]
    },
    {
        title: "Rooftop Bar Distrito",
        description: "El mejor rooftop de CDMX con vista a Reforma. Happy hour de 6-9PM.",
        image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
        category: "bar",
        subcategory: "rooftop",
        location: "Reforma, CDMX",
        is_verified: true,
        is_open_now: true,
        open_until: "1:00 AM",
        views: 1234,
        likes: 234,
        tags: ["rooftop", "happy hour", "cocteles", "vista"]
    },

    // CONCIERTOS
    {
        title: "Tributo a Queen - Teatro Vallarta",
        description: "Espectáculo musical con Bohemian Symphony. Revive la magia de Freddie Mercury.",
        image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        category: "concierto",
        subcategory: "tributo",
        location: "Teatro Vallarta, Centro",
        is_verified: true,
        is_open_now: false,
        views: 892,
        likes: 145,
        tags: ["queen", "rock", "tributo", "teatro"]
    },
    {
        title: "Festival EDM Playa 2026",
        description: "El festival de música electrónica más grande de la Riviera Maya. +20 DJs internacionales.",
        image_url: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80",
        category: "concierto",
        subcategory: "festival",
        location: "Playa del Carmen, Quintana Roo",
        is_verified: true,
        is_premium: true,
        views: 4567,
        likes: 891,
        tags: ["edm", "festival", "playa", "djs"]
    },

    // EVENTOS
    {
        title: "Pool Party @ Hotel W",
        description: "🏖️ El pool party más exclusivo de CDMX. Dress code: Beach glam. Solo lista.",
        image_url: "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=800&q=80",
        category: "evento",
        subcategory: "pool party",
        location: "Hotel W, Polanco",
        is_verified: true,
        is_premium: true,
        views: 2341,
        likes: 567,
        tags: ["pool party", "exclusivo", "polanco"]
    },
    {
        title: "Noche de Swingers - Evento Privado",
        description: "Evento exclusivo para parejas. Ubicación por confirmación. Solo verificados.",
        image_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
        category: "evento",
        subcategory: "swinger",
        location: "CDMX - Ubicación privada",
        is_verified: true,
        is_premium: true,
        views: 1876,
        likes: 342,
        tags: ["swingers", "parejas", "privado"]
    },

    // MASAJES
    {
        title: "Spa Sensual Polanco",
        description: "Masajes tántricos y relajantes. Ambiente discreto y privado. Masajistas certificadas.",
        image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
        category: "masaje",
        subcategory: "spa",
        location: "Polanco, CDMX",
        is_verified: true,
        is_premium: true,
        views: 3421,
        likes: 678,
        tags: ["tantrico", "spa", "relajante", "discreto"]
    }
];

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function seedDatabase() {
    console.log('\n🌱 VENUZ - Poblando base de datos...\n');
    console.log(`📊 Contenido a insertar: ${SEED_CONTENT.length} items\n`);

    let inserted = 0;
    let errors = 0;

    for (const item of SEED_CONTENT) {
        try {
            // Agregar timestamps
            const contentData = {
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('content')
                .upsert(contentData, {
                    onConflict: 'title', // Evita duplicados por título
                    ignoreDuplicates: true
                })
                .select();

            if (error) {
                console.error(`❌ Error insertando "${item.title}":`, error.message);
                errors++;
            } else {
                console.log(`✅ Insertado: ${item.title}`);
                inserted++;
            }
        } catch (err) {
            console.error(`❌ Error con "${item.title}":`, err.message);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 RESUMEN:`);
    console.log(`   ✅ Insertados: ${inserted}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log('='.repeat(50) + '\n');

    // Verificar contenido en la base de datos
    const { data: allContent, error: countError } = await supabase
        .from('content')
        .select('id, title, category')
        .order('created_at', { ascending: false });

    if (allContent) {
        console.log(`📦 Total en base de datos: ${allContent.length} items\n`);

        // Agrupar por categoría
        const byCategory = allContent.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});

        console.log('📁 Por categoría:');
        for (const [cat, count] of Object.entries(byCategory)) {
            console.log(`   ${cat}: ${count}`);
        }
    }

    console.log('\n🎉 ¡Listo! Refresca la app para ver el nuevo contenido.\n');
}

// Ejecutar
seedDatabase().catch(console.error);
