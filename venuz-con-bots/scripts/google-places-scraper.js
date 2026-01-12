const { createClient } = require('@supabase/supabase-js');

// ⚙️ CONFIGURACIÓN
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 📍 COORDENADAS DE PUERTO VALLARTA
const PUERTO_VALLARTA = {
  lat: 20.6534,
  lng: -105.2253
};

// 🎯 CATEGORÍAS A BUSCAR (Google Places types)
const BUSQUEDAS = [
  { query: 'night club Puerto Vallarta', type: 'club' },
  { query: 'bar Puerto Vallarta', type: 'bar' },
  { query: 'strip club Puerto Vallarta', type: 'tabledance' },
  { query: 'massage spa Puerto Vallarta', type: 'masaje' },
  { query: 'beach club Puerto Vallarta', type: 'beach' },
  { query: 'restaurant bar Puerto Vallarta', type: 'restaurante' },
  { query: 'karaoke Puerto Vallarta', type: 'bar' },
  { query: 'lounge bar Puerto Vallarta', type: 'bar' },
  { query: 'gay bar Puerto Vallarta', type: 'club' },
  { query: 'rooftop bar Puerto Vallarta', type: 'bar' },
  { query: 'cantina Puerto Vallarta', type: 'bar' },
  { query: 'disco Puerto Vallarta', type: 'club' },
  { query: 'adult entertainment Puerto Vallarta', type: 'club' },
  { query: 'gentlemen club Puerto Vallarta', type: 'tabledance' },
  { query: 'pool party Puerto Vallarta', type: 'evento' },
];

// 🔍 Buscar lugares en Google Places
async function buscarLugares(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${PUERTO_VALLARTA.lat},${PUERTO_VALLARTA.lng}&radius=25000&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`❌ Error en búsqueda "${query}":`, data.status, data.error_message || '');
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error(`❌ Error fetch "${query}":`, error.message);
    return [];
  }
}

// 📸 Obtener URL de foto de Google Places
function obtenerFotoUrl(photos) {
  if (!photos || photos.length === 0) {
    return `https://picsum.photos/400/600?random=${Date.now()}`;
  }
  
  const photoReference = photos[0].photo_reference;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

// 🏷️ Extraer zona de la dirección
function extraerZona(direccion) {
  const zonas = [
    'Centro', 'Zona Romántica', 'Romantic Zone', 'Marina Vallarta',
    'Zona Hotelera', 'Hotel Zone', 'Versalles', 'Pitillal',
    'Conchas Chinas', 'Amapas', '5 de Diciembre', 'Las Glorias',
    'Flamingos', 'Nuevo Vallarta', 'Bucerías', 'Punta de Mita',
    'Sayulita', 'Olas Altas', 'Malecón', 'El Centro'
  ];
  
  for (const zona of zonas) {
    if (direccion && direccion.toLowerCase().includes(zona.toLowerCase())) {
      return zona;
    }
  }
  
  return 'Puerto Vallarta';
}

// ⭐ Generar descripción basada en datos de Google
function generarDescripcion(place, tipo) {
  const zona = extraerZona(place.formatted_address);
  const rating = place.rating ? `⭐ ${place.rating}/5` : '';
  const reviews = place.user_ratings_total ? `(${place.user_ratings_total} reseñas)` : '';
  const abierto = place.opening_hours?.open_now ? '🟢 Abierto ahora' : '';
  
  const descripciones = {
    club: `Club nocturno en ${zona}. ${rating} ${reviews}. ${abierto}. El mejor ambiente para tu noche en Vallarta.`,
    bar: `Bar en ${zona}. ${rating} ${reviews}. ${abierto}. Bebidas, música y ambiente único.`,
    tabledance: `Entretenimiento adulto en ${zona}. ${rating} ${reviews}. ${abierto}. Shows en vivo y ambiente VIP.`,
    masaje: `Spa y masajes en ${zona}. ${rating} ${reviews}. ${abierto}. Relajación y bienestar garantizado.`,
    beach: `Beach club en ${zona}. ${rating} ${reviews}. ${abierto}. Sol, playa y fiesta.`,
    restaurante: `Restaurante-bar en ${zona}. ${rating} ${reviews}. ${abierto}. Gastronomía y ambiente.`,
    evento: `Eventos y fiestas en ${zona}. ${rating} ${reviews}. ${abierto}. No te lo pierdas.`
  };
  
  return descripciones[tipo] || `Lugar en ${zona}. ${rating} ${reviews}. ${abierto}`;
}

// 🔄 Transformar resultado de Google a formato de BD
function transformarLugar(place, tipo) {
  return {
    title: place.name,
    description: generarDescripcion(place, tipo),
    image_url: obtenerFotoUrl(place.photos),
    type: tipo,
    active: true,
    featured: place.rating >= 4.5 || (place.user_ratings_total || 0) > 100,
    views: Math.floor(Math.random() * 200) + 50,
    source_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    source_site: 'Google Places',
    // Datos adicionales de Google
    google_place_id: place.place_id,
    google_rating: place.rating || null,
    google_reviews_count: place.user_ratings_total || null,
    address: place.formatted_address || null,
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
  };
}

// 💾 Guardar en Supabase (evitar duplicados por google_place_id)
async function guardarEnSupabase(items) {
  if (items.length === 0) {
    console.log('⚠️  No hay items para guardar');
    return { nuevos: 0, actualizados: 0 };
  }
  
  let nuevos = 0;
  let actualizados = 0;
  
  for (const item of items) {
    try {
      // Verificar si existe por google_place_id o título
      const { data: existente } = await supabase
        .from('content')
        .select('id, google_place_id')
        .or(`google_place_id.eq.${item.google_place_id},title.eq.${item.title}`)
        .single();
      
      if (existente) {
        // Actualizar existente
        const { error } = await supabase
          .from('content')
          .update({
            google_rating: item.google_rating,
            google_reviews_count: item.google_reviews_count,
            updated_at: new Date().toISOString()
          })
          .eq('id', existente.id);
        
        if (!error) actualizados++;
      } else {
        // Insertar nuevo
        const { error } = await supabase
          .from('content')
          .insert(item);
        
        if (!error) nuevos++;
      }
    } catch (error) {
      // Si falla la verificación, intentar insertar
      const { error: insertError } = await supabase
        .from('content')
        .insert(item);
      
      if (!insertError) nuevos++;
    }
  }
  
  return { nuevos, actualizados };
}

// 🤖 Función principal
async function main() {
  console.log('🔥 ========================================');
  console.log('🗺️  VENUZ SCRAPER v3.0 - Google Places');
  console.log('📅', new Date().toISOString());
  console.log('📍 Target: Puerto Vallarta, MX');
  console.log('🔥 ========================================\n');
  
  if (!GOOGLE_API_KEY) {
    console.error('❌ ERROR: GOOGLE_PLACES_API_KEY no configurada');
    process.exit(1);
  }
  
  const todosLosLugares = [];
  const lugaresVistos = new Set(); // Evitar duplicados entre búsquedas
  
  // Ejecutar todas las búsquedas
  for (const busqueda of BUSQUEDAS) {
    console.log(`🔍 Buscando: "${busqueda.query}"...`);
    
    const resultados = await buscarLugares(busqueda.query);
    console.log(`   📦 Encontrados: ${resultados.length} lugares`);
    
    for (const lugar of resultados) {
      // Evitar duplicados
      if (lugaresVistos.has(lugar.place_id)) continue;
      lugaresVistos.add(lugar.place_id);
      
      const transformado = transformarLugar(lugar, busqueda.type);
      todosLosLugares.push(transformado);
    }
    
    // Pausa para no exceder rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n✅ Total lugares únicos: ${todosLosLugares.length}\n`);
  
  // Breakdown por tipo
  const breakdown = {};
  todosLosLugares.forEach(item => {
    breakdown[item.type] = (breakdown[item.type] || 0) + 1;
  });
  console.log('📊 Breakdown por categoría:');
  Object.entries(breakdown).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });
  
  // Guardar en Supabase
  console.log('\n💾 Guardando en Supabase...');
  const { nuevos, actualizados } = await guardarEnSupabase(todosLosLugares);
  
  console.log('\n🔥 ========================================');
  console.log('✅ Scraper completado exitosamente');
  console.log(`📊 Nuevos: ${nuevos} | Actualizados: ${actualizados}`);
  console.log('🔥 ========================================');
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
