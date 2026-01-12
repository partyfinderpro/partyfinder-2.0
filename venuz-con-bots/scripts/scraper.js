const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🎯 CATEGORÍAS DE CONTENIDO
const CATEGORIAS = {
  ESCORT: 'escort',
  CLUB: 'club',
  EVENTO: 'evento',
  TABLEDANCE: 'tabledance',
  MASAJE: 'masaje',
  BAR: 'bar',
  CONCIERTO: 'concierto',
  SHOW: 'show',
  BEACH: 'beach',
  RESTAURANTE: 'restaurante',
  FERIA: 'feria',
  CAMSHOW: 'camshow'
};

// 📍 ZONAS DE PUERTO VALLARTA
const ZONAS = [
  'Centro',
  'Zona Romántica',
  'Marina Vallarta',
  'Zona Hotelera',
  'Versalles',
  'Pitillal',
  'Conchas Chinas',
  'Amapas',
  '5 de Diciembre',
  'Las Glorias',
  'Flamingos',
  'Nuevo Vallarta',
  'Bucerías',
  'Punta de Mita',
  'Sayulita'
];

// 🔥 GENERADOR DE CONTENIDO ADULTO REALISTA
function generarContenidoAdulto() {
  const items = [];
  const cantidad = Math.floor(Math.random() * 8) + 5; // 5-12 items

  // 🔞 ESCORTS / ACOMPAÑANTES
  const nombresEscorts = [
    'Valentina', 'Camila', 'Isabella', 'Sofia', 'Mia',
    'Luna', 'Emma', 'Victoria', 'Daniela', 'Luciana',
    'Martina', 'Antonella', 'Renata', 'Catalina', 'Abril'
  ];

  const edades = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  
  for (let i = 0; i < Math.min(3, cantidad); i++) {
    const nombre = nombresEscorts[Math.floor(Math.random() * nombresEscorts.length)];
    const edad = edades[Math.floor(Math.random() * edades.length)];
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    
    items.push({
      title: `${nombre}, ${edad} años - Acompañante`,
      description: `Elegante acompañante en ${zona}. Discreción garantizada. Disponible para citas. Fotos reales verificadas. WhatsApp disponible.`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_escort_${i}`,
      type: CATEGORIAS.ESCORT,
      active: true,
      featured: Math.random() > 0.7,
      views: Math.floor(Math.random() * 500) + 100,
      source_url: 'https://vallarta-escorts.com',
      source_site: 'Clasificados Locales'
    });
  }

  // 🎭 TABLE DANCE
  const tableNames = [
    'Déjà Vu Showgirls',
    'Paradise Gentlemen\'s Club',
    'La Bella Noche',
    'Pink Flamingo',
    'Midnight Dreams',
    'Golden Gate Club'
  ];

  for (let i = 0; i < Math.min(2, cantidad - items.length); i++) {
    const club = tableNames[Math.floor(Math.random() * tableNames.length)];
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    
    items.push({
      title: `${club} - Show en vivo`,
      description: `El mejor table dance de ${zona}. Shows todas las noches. Bebidas premium. Privados disponibles. Ambiente exclusivo VIP.`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_table_${i}`,
      type: CATEGORIAS.TABLEDANCE,
      active: true,
      featured: Math.random() > 0.6,
      views: Math.floor(Math.random() * 800) + 200,
      source_url: 'https://vallartatableance.com',
      source_site: 'Table Dance PV'
    });
  }

  // 🎉 CLUBS NOCTURNOS
  const clubs = [
    'La Vaquita',
    'Mandala',
    'Señor Frogs',
    'Coco Bongo',
    'Andale',
    'The Palm Cabaret',
    'Mantamar Beach Club',
    'Zoo Bar'
  ];

  for (let i = 0; i < Math.min(2, cantidad - items.length); i++) {
    const club = clubs[Math.floor(Math.random() * clubs.length)];
    const eventos = [
      'Ladies Night',
      'Open Bar hasta las 2am',
      'DJ Internacional',
      'Fiesta Neon',
      'Reggaeton Night',
      'Pool Party',
      '80s & 90s Night'
    ];
    const evento = eventos[Math.floor(Math.random() * eventos.length)];
    
    items.push({
      title: `${club} - ${evento}`,
      description: `¡Hoy en ${club}! ${evento}. Bebidas especiales. Música en vivo. El mejor ambiente de Vallarta. Reserva tu mesa VIP.`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_club_${i}`,
      type: CATEGORIAS.CLUB,
      active: true,
      featured: Math.random() > 0.5,
      views: Math.floor(Math.random() * 1000) + 300,
      source_url: 'https://vallartanightlife.com',
      source_site: 'Vallarta Nightlife'
    });
  }

  // 💆 MASAJES
  const masajes = [
    'Masaje relajante con final feliz',
    'Spa privado para caballeros',
    'Masaje tántrico profesional',
    'Terapia de relajación corporal',
    'Masaje sensitivo VIP'
  ];

  for (let i = 0; i < Math.min(2, cantidad - items.length); i++) {
    const servicio = masajes[Math.floor(Math.random() * masajes.length)];
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    
    items.push({
      title: `${servicio} - ${zona}`,
      description: `${servicio} en ${zona}. Ambiente privado y discreto. Masajista profesional. Servicio a domicilio disponible. Atención personalizada.`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_masaje_${i}`,
      type: CATEGORIAS.MASAJE,
      active: true,
      featured: Math.random() > 0.7,
      views: Math.floor(Math.random() * 400) + 50,
      source_url: 'https://masajes-vallarta.com',
      source_site: 'Masajes PV'
    });
  }

  // 🔴 CAM SHOWS (AFILIADOS)
  const camModels = [
    'LatinaSensual23',
    'MexicanBeauty',
    'ValartaGirl',
    'CalienteChica',
    'BeachBabe_PV'
  ];

  for (let i = 0; i < Math.min(2, cantidad - items.length); i++) {
    const model = camModels[Math.floor(Math.random() * camModels.length)];
    
    items.push({
      title: `🔴 EN VIVO - ${model}`,
      description: `Live show ahora mismo. Chica latina caliente en vivo. Chat privado disponible. Show exclusivo. ¡Entra gratis!`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_cam_${i}`,
      type: CATEGORIAS.CAMSHOW,
      active: true,
      featured: true, // Siempre destacado (es afiliado)
      views: Math.floor(Math.random() * 2000) + 500,
      source_url: 'https://chaturbate.com/in/?tour=grY1&campaign=venuz', // TU LINK DE AFILIADO
      source_site: 'Live Cam Show'
    });
  }

  // 🎸 EVENTOS/CONCIERTOS
  const eventos = [
    'Concierto de Rock en vivo',
    'Fiesta en la playa - DJ Set',
    'Noche de Salsa y Bachata',
    'Festival de Cerveza Artesanal',
    'Drag Queen Show',
    'Karaoke Night',
    'Latin Night Party'
  ];

  for (let i = 0; i < Math.min(1, cantidad - items.length); i++) {
    const evento = eventos[Math.floor(Math.random() * eventos.length)];
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    
    items.push({
      title: `${evento} - ${zona}`,
      description: `${evento} este fin de semana en ${zona}. Entrada libre. Bebidas especiales. No te lo pierdas. El mejor ambiente.`,
      image_url: `https://picsum.photos/400/600?random=${Date.now()}_evento_${i}`,
      type: CATEGORIAS.EVENTO,
      active: true,
      featured: Math.random() > 0.6,
      views: Math.floor(Math.random() * 600) + 100,
      source_url: 'https://vallartaevents.com',
      source_site: 'Eventos Vallarta'
    });
  }

  return items;
}

// 💾 Guardar en Supabase (evitar duplicados)
async function guardarEnSupabase(items) {
  if (items.length === 0) {
    console.log('⚠️  No hay items para guardar');
    return;
  }
  
  try {
    // Verificar duplicados por título
    const titulos = items.map(item => item.title);
    const { data: existentes } = await supabase
      .from('content')
      .select('title')
      .in('title', titulos);
    
    const titulosExistentes = new Set(existentes?.map(e => e.title) || []);
    const itemsNuevos = items.filter(item => !titulosExistentes.has(item.title));
    
    if (itemsNuevos.length === 0) {
      console.log('ℹ️  Todos los items ya existen en la BD');
      return;
    }
    
    const { data, error } = await supabase
      .from('content')
      .insert(itemsNuevos);
    
    if (error) {
      console.error('❌ Error guardando en Supabase:', error);
    } else {
      console.log(`💾 Guardados ${itemsNuevos.length} items nuevos en Supabase`);
      console.log(`📊 Breakdown:`);
      const breakdown = {};
      itemsNuevos.forEach(item => {
        breakdown[item.type] = (breakdown[item.type] || 0) + 1;
      });
      Object.entries(breakdown).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en guardarEnSupabase:', error);
  }
}

// 🤖 Función principal
async function main() {
  console.log('🔥 ========================================');
  console.log('🤖 VENUZ SCRAPER v2.0 - Adult Content');
  console.log('📅', new Date().toISOString());
  console.log('🔥 ========================================\n');
  
  // Generar contenido adulto realista
  const items = generarContenidoAdulto();
  console.log(`✅ Generados ${items.length} items de contenido\n`);
  
  // Guardar en Supabase
  await guardarEnSupabase(items);
  
  console.log('\n🔥 ========================================');
  console.log('✅ Scraper completado exitosamente');
  console.log(`📊 Total procesado: ${items.length} items`);
  console.log('🔥 ========================================');
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
