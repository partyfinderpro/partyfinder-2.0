const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ⚙️ CONFIGURACIÓN
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📍 COORDENADAS DE PUERTO VALLARTA
const PUERTO_VALLARTA = {
  lat: 20.6534,
  lng: -105.2253
};

// 🎯 CATEGORÍAS A BUSCAR
const BUSQUEDAS = [
  { query: 'night club', type: 'club' },
  { query: 'bar', type: 'bar' },
  { query: 'strip club', type: 'tabledance' },
  { query: 'massage spa', type: 'masaje' },
  { query: 'beach club', type: 'beach' },
  { query: 'restaurant bar', type: 'restaurante' },
  { query: 'karaoke', type: 'bar' },
  { query: 'lounge', type: 'bar' },
  { query: 'gay bar', type: 'club' },
  { query: 'rooftop bar', type: 'bar' },
  { query: 'cantina', type: 'bar' },
  { query: 'disco', type: 'club' },
  { query: 'gentlemen club', type: 'tabledance' },
  { query: 'pool party', type: 'evento' },
  { query: 'cocktail bar', type: 'bar' },
  { query: 'sports bar', type: 'bar' },
  { query: 'pub', type: 'bar' },
  { query: 'adult entertainment', type: 'club' },
];

// 🔍 Buscar lugares en Foursquare
async function buscarLugares(query) {
  const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&ll=${PUERTO_VALLARTA.lat},${PUERTO_VALLARTA.lng}&radius=25000&limit=50`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en búsqueda "${query}": ${response.status} ${errorText}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`❌ Error fetch "${query}":`, error.message);
    return [];
  }
}

// 📸 Obtener foto de Foursquare
async function obtenerFoto(fsqId) {
  try {
    const url = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const photos = await response.json();
    if (photos && photos.length > 0) {
      const photo = photos[0];
      return `${photo.prefix}800x600${photo.suffix}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 🏷️ Extraer zona de la dirección
function extraerZona(lugar) {
  const direccion = lugar.location?.formatted_address || lugar.location?.locality || '';
  const zonas = [
    'Centro', 'Zona Romántica', 'Romantic Zone', 'Marina Vallarta',
    'Zona Hotelera', 'Hotel Zone', 'Versalles', 'Pitillal',
    'Conchas Chinas', 'Amapas', '5 de Diciembre', 'Las Glorias',
    'Flamingos', 'Nuevo Vallarta', 'Bucerías', 'Punta de Mita',
    'Sayulita', 'Olas Altas', 'Malecón', 'El Centro', 'Emiliano Zapata'
  ];

  for (const zona of zonas) {
    if (direccion.toLowerCase().includes(zona.toLowerCase())) {
      return zona;
    }
  }

  return lugar.location?.locality || 'Puerto Vallarta';
}

// ⭐ Generar descripción
function generarDescripcion(place, tipo) {
  const zona = extraerZona(place);
  const categorias = place.categories?.map(c => c.name).join(', ') || '';

  const descripciones = {
    club: `Club nocturno en ${zona}. ${categorias}. El mejor ambiente para tu noche en Vallarta.`,
    bar: `Bar en ${zona}. ${categorias}. Bebidas, música y ambiente único.`,
    tabledance: `Entretenimiento adulto en ${zona}. ${categorias}. Shows en vivo y ambiente VIP.`,
    masaje: `Spa y masajes en ${zona}. ${categorias}. Relajación y bienestar garantizado.`,
    beach: `Beach club en ${zona}. ${categorias}. Sol, playa y fiesta.`,
    restaurante: `Restaurante-bar en ${zona}. ${categorias}. Gastronomía y ambiente.`,
    evento: `Eventos y fiestas en ${zona}. ${categorias}. No te lo pierdas.`
  };

  return descripciones[tipo] || `Lugar en ${zona}. ${categorias}`;
}

// 🔄 Transformar resultado de Foursquare a formato de BD
async function transformarLugar(place, tipo) {
  // Intentar obtener foto
  let fotoUrl = await obtenerFoto(place.fsq_id);
  if (!fotoUrl) {
    fotoUrl = `https://picsum.photos/400/600?random=${Date.now()}_${place.fsq_id}`;
  }

  const direccion = place.location?.formatted_address ||
    [place.location?.address, place.location?.locality, place.location?.region]
      .filter(Boolean).join(', ');

  return {
    title: place.name,
    description: generarDescripcion(place, tipo),
    image_url: fotoUrl,
    category: tipo, // Usamos category_id o slug en el futuro, por ahora tipo
    active: true,
    featured: (place.popularity || 0) > 0.7,
    views: Math.floor(Math.random() * 200) + 50,
    source_url: `https://foursquare.com/v/${place.fsq_id}`,
    source_site: 'Foursquare',

    // 🔥 NUEVA ESTRUCTURA "OJO DE DIOS"
    rating: place.rating ? (place.rating / 2) : null, // Foursquare 0-10 -> 0-5
    reviews_count: place.stats?.total_ratings || 0,
    price_level: place.price || null,
    external_ids: { foursquare: place.fsq_id },
    location_text: direccion,
    lat: place.geocodes?.main?.latitude || null,
    lng: place.geocodes?.main?.longitude || null,
    metadata: {
      categories: place.categories?.map(c => c.name) || [],
      foursquare_popularity: place.popularity || 0,
      target_profiles: tipo === 'club' || tipo === 'tabledance' ? ['party-animal'] : ['general']
    },
    scraped_at: new Date().toISOString()
  };
}

// 💾 Guardar en Supabase
async function guardarEnSupabase(items) {
  if (items.length === 0) {
    console.log('⚠️  No hay items para guardar');
    return { nuevos: 0, actualizados: 0 };
  }

  let nuevos = 0;
  let actualizados = 0;

  for (const item of items) {
    try {
      // Verificar si existe por fsq_id en external_ids (JSONB query) o título
      // Nota: La sintaxis ->> 'foursquare' busca dentro del JSONB
      const { data: existente } = await supabase
        .from('content')
        .select('id')
        .or(`external_ids->>foursquare.eq.${item.external_ids.foursquare},title.eq.${item.title}`)
        .maybeSingle();

      if (existente) {
        // Actualizar existente
        const { error } = await supabase
          .from('content')
          .update({
            rating: item.rating,
            reviews_count: item.reviews_count,
            price_level: item.price_level,
            location_text: item.location_text,
            lat: item.lat,
            lng: item.lng,
            metadata: item.metadata,
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
        else console.error(`Error insertando ${item.title}:`, error.message);
      }
    } catch (error) {
      console.error(`Error procesando ${item.title}:`, error);
    }
  }

  return { nuevos, actualizados };
}

// 🤖 Función principal
async function main() {
  console.log('🔥 ========================================');
  console.log('🗺️  VENUZ SCRAPER v4.0 - Foursquare');
  console.log('📅', new Date().toISOString());
  console.log('📍 Target: Puerto Vallarta, MX');
  console.log('🔥 ========================================\n');

  if (!FOURSQUARE_API_KEY) {
    console.error('❌ ERROR: FOURSQUARE_API_KEY no configurada');
    process.exit(1);
  }

  const todosLosLugares = [];
  const lugaresVistos = new Set();

  // Ejecutar todas las búsquedas
  for (const busqueda of BUSQUEDAS) {
    console.log(`🔍 Buscando: "${busqueda.query}"...`);

    const resultados = await buscarLugares(busqueda.query);
    console.log(`   📦 Encontrados: ${resultados.length} lugares`);

    for (const lugar of resultados) {
      // Evitar duplicados
      if (lugaresVistos.has(lugar.fsq_id)) continue;
      lugaresVistos.add(lugar.fsq_id);

      const transformado = await transformarLugar(lugar, busqueda.type);
      todosLosLugares.push(transformado);
    }

    // Pausa para no exceder rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
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
