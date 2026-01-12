const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Sitios para scrapear
const SITIOS = [
  {
    url: 'https://www.vallartainfo.com/events',
    nombre: 'Vallarta Info',
    tipo: 'evento'
  },
  {
    url: 'https://www.puertovallarta.net/what-to-do/nightlife.php',
    nombre: 'PV Net',
    tipo: 'club'
  }
];

// Función para extraer contenido de un sitio
async function scrapearSitio(sitio) {
  try {
    console.log(`🔍 Scrapeando: ${sitio.nombre}`);
    
    const response = await axios.get(sitio.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const items = [];
    
    // Extrae títulos y descripciones (ajusta selectores según el sitio)
    $('h2, h3, .event-title, .listing-title').each((i, elem) => {
      const titulo = $(elem).text().trim();
      const descripcion = $(elem).next('p').text().trim() || 
                         $(elem).parent().find('p').first().text().trim() ||
                         'Evento en Puerto Vallarta';
      
      if (titulo && titulo.length > 5 && titulo.length < 200) {
        items.push({
          title: titulo,
          description: descripcion.substring(0, 500),
          image_url: 'https://picsum.photos/400/600?random=' + Math.floor(Math.random() * 10000),
          type: sitio.tipo,
          active: true,
          featured: Math.random() > 0.7, // 30% featured
          views: Math.floor(Math.random() * 1000),
          source_url: sitio.url,
          source_site: sitio.nombre
        });
      }
    });
    
    console.log(`✅ Encontrados ${items.length} items en ${sitio.nombre}`);
    return items;
    
  } catch (error) {
    console.error(`❌ Error scrapeando ${sitio.nombre}:`, error.message);
    return [];
  }
}

// Guardar en Supabase (evitar duplicados)
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
    }
    
  } catch (error) {
    console.error('❌ Error en guardarEnSupabase:', error);
  }
}

// Función principal
async function main() {
  console.log('🤖 Iniciando scraper automático VENUZ...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  let todosLosItems = [];
  
  // Scrapear todos los sitios
  for (const sitio of SITIOS) {
    const items = await scrapearSitio(sitio);
    todosLosItems = todosLosItems.concat(items);
    
    // Esperar 2 segundos entre sitios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Guardar todo en Supabase
  await guardarEnSupabase(todosLosItems);
  
  console.log('✅ Scraper completado');
  console.log(`📊 Total procesado: ${todosLosItems.length} items`);
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
