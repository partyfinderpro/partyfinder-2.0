const { createClient } = require('@supabase/supabase-js');

// ⚙️ CONFIGURACIÓN
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 📍 BOUNDING BOX DE PUERTO VALLARTA (lat_min, lon_min, lat_max, lon_max)
const PUERTO_VALLARTA_BBOX = '20.5,-105.35,20.75,-105.15';

// 🎯 CONSULTAS OVERPASS POR CATEGORÍA
const BUSQUEDAS = [
  { 
    amenity: 'nightclub', 
    type: 'club',
    nombre: 'Night Clubs'
  },
  { 
    amenity: 'bar', 
    type: 'bar',
    nombre: 'Bares'
  },
  { 
    amenity: 'pub', 
    type: 'bar',
    nombre: 'Pubs'
  },
  { 
    amenity: 'restaurant', 
    type: 'restaurante',
    nombre: 'Restaurantes'
  },
  { 
    amenity: 'cafe', 
    type: 'restaurante',
    nombre: 'Cafés'
  },
  { 
    leisure: 'beach_resort', 
    type: 'beach',
    nombre: 'Beach Resorts'
  },
  { 
    tourism: 'hotel', 
    type: 'hotel',
    nombre: 'Hoteles'
  },
  { 
    amenity: 'spa', 
    type: 'masaje',
    nombre: 'Spas'
  },
  { 
    shop: 'massage', 
    type: 'masaje',
    nombre: 'Masajes'
  },
  { 
    amenity: 'casino', 
    type: 'club',
    nombre: 'Casinos'
  },
  { 
    amenity: 'stripclub', 
    type: 'tabledance',
    nombre: 'Strip Clubs'
  },
  { 
    leisure: 'dance', 
    type: 'club',
    nombre: 'Dance Clubs'
  },
];

// 🔍 Buscar lugares con Overpass API
async function buscarLugares(busqueda) {
  const tag = busqueda.amenity ? `amenity=${busqueda.amenity}` : 
              busqueda.leisure ? `leisure=${busqueda.leisure}` :
              busqueda.tourism ? `tourism=${busqueda.tourism}` :
              busqueda.shop ? `shop=${busqueda.shop}` : '';
  
  const query = `
    [out:json][timeout:25];
    (
      node[${tag}](${PUERTO_VALLARTA_BBOX});
      way[${tag}](${PUERTO_VALLARTA_BBOX});
      relation[${tag}](${PUERTO_VALLARTA_BBOX});
    );
    out center;
  `;
  
  const url = 'https://overpass-api.de/api/interpreter';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Error en búsqueda "${busqueda.nombre}": ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error(`❌ Error fetch "${busqueda.nombre}":`, error.message);
    return [];
  }
}

// 🏷️ Extraer zona de las coordenadas
function extraerZona(lat, lon) {
  // Zonas aproximadas de Puerto Vallarta por coordenadas
  if (lat > 20.65 && lon < -105.23) return 'Marina Vallarta';
  if (lat < 20.60 && lon > -105.24) return 'Zona Romántica';
  if (lat > 20.60 && lat < 20.65 && lon > -105.25) return 'Centro';
  if (lat > 20.70) return 'Nuevo Vallarta';
  if (lon < -105.28) return 'Zona Hotelera';
  return 'Puerto Vallarta';
}

// ⭐ Generar descripción
function generarDescripcion(element, tipo) {
  const nombre = element.tags?.name || 'Lugar';
  const zona = extraerZona(
    element.lat || element.center?.lat,
    element.lon || element.center?.lon
  );
  const cuisine = element.tags?.cuisine ? ` Cocina: ${element.tags.cuisine}.` : '';
  const phone = element.tags?.phone ? ` Tel: ${element.tags.phone}.` : '';
  const website = element.tags?.website ? ' Sitio web disponible.' : '';
  const horario = element.tags?.opening_hours ? ` Horario: ${element.tags.opening_hours}.` : '';
  
  const descripciones = {
    club: `Club nocturno en ${zona}.${cuisine}${horario} El mejor ambiente para tu noche en Vallarta.`,
    bar: `Bar en ${zona}.${cuisine}${horario} Bebidas, música y ambiente único.`,
    tabledance: `Entretenimiento adulto en ${zona}.${horario} Shows en vivo y ambiente VIP.`,
    masaje: `Spa y masajes en ${zona}.${horario} Relajación y bienestar garantizado.`,
    beach: `Beach club en ${zona}.${horario} Sol, playa y fiesta.`,
    restaurante: `Restaurante en ${zona}.${cuisine}${horario} Gastronomía local e internacional.`,
    hotel: `Hotel en ${zona}.${website} Hospedaje y servicios.`,
    evento: `Eventos y fiestas en ${zona}.${horario} No te lo pierdas.`
  };
  
  return descripciones[tipo] || `Lugar en ${zona}.${phone}${website}`;
}

// 🔄 Transformar resultado de OSM a formato de BD
function transformarLugar(element, tipo) {
  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;
  const nombre = element.tags?.name;
  
  // Solo procesar si tiene nombre
  if (!nombre) return null;
  
  const osmId = `osm_${element.type}_${element.id}`;
  const zona = extraerZona(lat, lon);
  
  // Construir dirección
  const direccion = [
    element.tags?.['addr:street'],
    element.tags?.['addr:housenumber'],
    element.tags?.['addr:city'] || 'Puerto Vallarta',
    'Jalisco, México'
  ].filter(Boolean).join(', ') || `${zona}, Puerto Vallarta, Jalisco, México`;
  
  return {
    title: nombre,
    description: generarDescripcion(element, tipo),
    image_url: `https://picsum.photos/400/600?random=${Date.now()}_${element.id}`,
    type: tipo,
    active: true,
    featured: Math.random() > 0.7,
    views: Math.floor(Math.random() * 200) + 50,
    source_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    source_site: 'OpenStreetMap',
    google_place_id: osmId,
    google_rating: null,
    google_reviews_count: null,
    address: direccion,
    latitude: lat,
    longitude: lon,
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
      // Verificar si existe
      const { data: existente } = await supabase
        .from('content')
        .select('id, google_place_id')
        .or(`google_place_id.eq.${item.google_place_id},title.eq.${item.title}`)
        .maybeSingle();
      
      if (existente) {
        // Actualizar
        const { error } = await supabase
          .from('content')
          .update({
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
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
        else console.error('Error insertando:', item.title, error.message);
      }
    } catch (error) {
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
  console.log('🗺️  VENUZ SCRAPER v5.0 - OpenStreetMap');
  console.log('📅', new Date().toISOString());
  console.log('📍 Target: Puerto Vallarta, MX');
  console.log('🔥 ========================================\n');
  
  const todosLosLugares = [];
  const lugaresVistos = new Set();
  
  // Ejecutar todas las búsquedas
  for (const busqueda of BUSQUEDAS) {
    console.log(`🔍 Buscando: "${busqueda.nombre}"...`);
    
    const resultados = await buscarLugares(busqueda);
    let agregados = 0;
    
    for (const elemento of resultados) {
      const id = `${elemento.type}_${elemento.id}`;
      if (lugaresVistos.has(id)) continue;
      
      const transformado = transformarLugar(elemento, busqueda.type);
      if (transformado) {
        lugaresVistos.add(id);
        todosLosLugares.push(transformado);
        agregados++;
      }
    }
    
    console.log(`   📦 Encontrados: ${resultados.length} | Con nombre: ${agregados}`);
    
    // Pausa para no sobrecargar Overpass API
    await new Promise(resolve => setTimeout(resolve, 1000));
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
