const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Bots Army Imports
const TheWatcher = require('./bots/watcher');
const TheHunter = require('./bots/hunter');
const TheSeducer = require('./bots/seducer');
const TheSpecialist = require('./bots/specialist');
const TheGladiator = require('./bots/sports_gladiator'); // Sports Events (TheSportsDB)
const TheSocialite = require('./bots/eventbrite'); // Eventbrite Events V2
const GooglePlacesHunter = require('./bots/google_places');
const ApifyHunter = require('./bots/apify_hunter');
const ThePromoter = require('./bots/ticketmaster'); // Ticketmaster Events
const TheScouter = require('./bots/seatgeek'); // SeatGeek Events (New)
const TheGroupie = require('./bots/bandsintown'); // Bandsintown Live Music (New)
const TijuanaBot = require('./bots/tijuana_bot'); // TJ Special Ops (New)

// Nuevos Módulos de Inteligencia (Fase 1 Integrada)
const { applyQualityFilters } = require('./utils/qualityFilters');
const { processAndUploadImage } = require('./utils/imageProcessor');


// Initialize Supabase con Llave de Admin (Bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Error: Supabase credentials missing. Create a .env file.");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ WARNING: Using ANON_KEY. Database writes may fail due to RLS. Add SUPABASE_SERVICE_ROLE_KEY to .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * TIKTOK-STYLE ALGORITHM: Scoring Engine
 * Assigns a score to content based on recency, relevance, and "X-Factor"
 */
function calculateTikTokScore(item) {
  let score = 100; // Base score

  // 1. Recency Boost (Freshness is key)
  const now = new Date();
  const scrapedAt = item.scraped_at ? new Date(item.scraped_at) : now;
  const hoursOld = (now - scrapedAt) / (1000 * 60 * 60);
  score += Math.max(0, 500 - (hoursOld * 10)); // Lose 10 points per hour

  // 2. Category/Tag Relevance
  const hotTags = ['oferta', 'descuento', 'real-time', 'trending', 'promo', 'high-priority', 'exclusive'];
  if (item.tags && item.tags.some(tag => hotTags.includes(tag.toLowerCase()))) {
    score += 250; // Increased weight for prioritised content
  }

  // 3. Priority Types
  if (item.type === 'alert') score += 300; // Alerts always top
  if (item.type === 'deal') score += 400;  // Specialist deals are top priority
  if (item.type === 'club' && item.description && item.description.includes('$$')) score += 50;

  // 4. The "X-Factor" (Random Exploration Boost)
  score += Math.floor(Math.random() * 50);

  return Math.floor(score);
}

/**
 * COMMAND CENTER: Orchestrates the Army
 */
async function runOmniScraper() {
  console.log("🚀 VENUZ COMMAND CENTER: ORCHESTRATING ARMY\n" + "=".repeat(40));

  try {
    // 1. Initialize Context (Regions/Categories)
    const { data: regions } = await supabase.from('regions').select('*');
    const { data: categories } = await supabase.from('categories').select('*');

    console.log(`📊 Unit Context: ${regions?.length || 0} regions, ${categories?.length || 0} categories.`);

    const getCatId = (slug) => categories?.find(c => c.slug === slug)?.id || null;

    // 2. Launch Specialized Bots
    const allResults = [];

    // Launcher: The Specialist (High Priority)
    const premiumContent = await TheSpecialist.scrape();
    const clubCatId = getCatId('clubes-eventos') || getCatId('alertas-noticias');
    premiumContent.forEach(p => allResults.push({ ...p, category_id: clubCatId }));

    // Launcher: The Watcher
    const alerts = await TheWatcher.scrape();
    const alertCatId = getCatId('alertas-noticias');
    alerts.forEach(a => allResults.push({ ...a, category_id: alertCatId }));

    // Launcher: The Hunter (Region-Specific)
    for (const region of regions || []) {
      const venues = await TheHunter.scrape(region);
      const hunterCatId = getCatId('clubes-eventos');
      venues.forEach(v => allResults.push({ ...v, category_id: hunterCatId, region_id: region.id }));
    }

    // Launcher: The Seducer
    const socialContent = await TheSeducer.scrape();
    const adultCatId = getCatId('contenido-xxx');
    socialContent.forEach(s => allResults.push({ ...s, category_id: adultCatId }));

    // Launcher: The Socialite (Playwright Events)
    const eventContent = await TheSocialite.scrape();
    const eventCatId = getCatId('clubes-eventos');
    eventContent.forEach(e => allResults.push({ ...e, category_id: eventCatId }));

    // Launcher: Google Places Hunter (REAL DATA from Google API)
    console.log('\n🌍 LAUNCHING GOOGLE PLACES HUNTER...');
    const googleContent = await GooglePlacesHunter.scrapeAll();
    googleContent.forEach(g => allResults.push({ ...g, category_id: eventCatId }));

    // Launcher: The Promoter (Ticketmaster Events)
    console.log('\n🎫 LAUNCHING TICKETMASTER PROMOTER...');
    const ticketmasterContent = await ThePromoter.scrape();
    ticketmasterContent.forEach(t => allResults.push({ ...t, category_id: eventCatId }));

    // Launcher: The Gladiator (Sports)
    console.log('\n🥊 LAUNCHING GLADIATOR (SPORTS)...');
    const sportsContent = await TheGladiator.scrape();
    sportsContent.forEach(s => allResults.push({ ...s, category_id: eventCatId }));

    // Launcher: The Scouter (SeatGeek)
    console.log('\n🏟️ LAUNCHING SCOUTER (SEATGEEK)...');
    const seatgeekContent = await TheScouter.scrape();
    seatgeekContent.forEach(s => allResults.push({ ...s, category_id: eventCatId }));

    // Launcher: The Groupie (Bandsintown)
    console.log('\n🎸 LAUNCHING GROUPIE (BANDSINTOWN)...');
    const bandsintownContent = await TheGroupie.scrape();
    bandsintownContent.forEach(b => allResults.push({ ...b, category_id: eventCatId }));

    // Launcher: Tijuana Special Ops (Dominio Local)
    console.log('\n🌮 LAUNCHING TIJUANA SPECIAL OPS...');
    const tijuanaBot = new TijuanaBot();
    const tijuanaContent = await tijuanaBot.scrape();
    // Default cat ID for now, logic inside bot can refine
    tijuanaContent.forEach(t => allResults.push({ ...t, category_id: eventCatId }));

    // Launcher: Apify Hunter (Instagram, TikTok, Facebook)
    console.log('\n🎯 LAUNCHING APIFY HUNTER (Social Media)...');
    const apifyContent = await ApifyHunter.scrapeAll();
    apifyContent.forEach(a => allResults.push({ ...a, category_id: getCatId(a.category) || eventCatId }));

    // 3. Apply TikTok Algorithm & Preparation
    console.log(`\n🧠 Processing ${allResults.length} items through TikTok Engine...`);

    // CITY CENTER COORDINATES (Fallback)
    const CITY_COORDS = {
      'vallarta': { lat: 20.6534, lng: -105.2253 },
      'guadalajara': { lat: 20.6597, lng: -103.3496 },
      'cdmx': { lat: 19.4326, lng: -99.1332 },
      'monterrey': { lat: 25.6866, lng: -100.3161 },
      'cancun': { lat: 21.1619, lng: -86.8515 },
      'tijuana': { lat: 32.5149, lng: -117.0382 },
      'playa': { lat: 20.6296, lng: -87.0739 } // Playa del Carmen
    };

    const processedContent = allResults.map(item => {
      const now = new Date().toISOString();
      let itemWithTime = { ...item, scraped_at: item.scraped_at || now };

      // GEOLOCATION FALLBACK PATCH 📍
      if (!itemWithTime.latitude || !itemWithTime.longitude) {
        const textToScan = (item.title + ' ' + (item.tags ? item.tags.join(' ') : '')).toLowerCase();

        for (const [key, coords] of Object.entries(CITY_COORDS)) {
          if (textToScan.includes(key)) {
            itemWithTime.latitude = coords.lat;
            itemWithTime.longitude = coords.lng;
            // Add small random jitter (0.005) so they don't stack perfectly on top of each other
            itemWithTime.latitude += (Math.random() - 0.5) * 0.01;
            itemWithTime.longitude += (Math.random() - 0.5) * 0.01;
            break;
          }
        }
      }

      return {
        ...itemWithTime,
        rank_score: calculateTikTokScore(itemWithTime),
        active: true
      };
    });

    // 4. Mass Deployment (Save to Supabase)
    await saveToSupabase(processedContent);

    console.log("\n✨ MISSION COMPLETE: ARMY IS DEPLOYED!");
  } catch (error) {
    console.error("❌ Critical Command Center Failure:", error.message);
  }
}

async function saveToSupabase(items) {
  if (items.length === 0) return;

  console.log(`\n🧠 PROCESSING QUALITY GATES FOR ${items.length} ITEMS...`);

  // Obtener items existentes para comparación de duplicados (Optimización: traer solo títulos y coords recientes)
  // Para MVP, traemos los últimos 1000 items activos.
  const { data: existingEvents } = await supabase
    .from('content')
    .select('title, description, latitude, longitude')
    .eq('active', true)
    .limit(1000);

  const cleanItems = [];
  let rejectedCount = 0;

  for (const item of items) {
    // 1. Filtros de Calidad
    const { approved, reason, correctedEvent } = await applyQualityFilters(item, existingEvents || []);

    if (!approved) {
      console.log(`   ⛔ Rejected [${reason}]: ${item.title.substring(0, 40)}...`);
      rejectedCount++;
      continue;
    }

    // 2. Procesamiento de Imagen (Solo si tiene imagen externa no procesada)
    // Nota: Esto puede ser lento. Para producción masiva, mover a Worker separado.
    // Activamos solo para eventos con imágenes válidas.
    if (correctedEvent.image_url && !correctedEvent.image_url.includes('supabase')) {
      console.log(`   📸 Processing image for: ${correctedEvent.title}...`);
      try {
        const processedIds = await processAndUploadImage(correctedEvent.image_url, correctedEvent.id || require('uuid').v4());
        if (processedIds) {
          correctedEvent.thumbnail_url = processedIds.thumbnail;
          correctedEvent.medium_url = processedIds.medium;
          correctedEvent.large_url = processedIds.large;
          correctedEvent.image_url = processedIds.medium; // Use medium as default
          console.log(`   ✅ Image optimized: 3 variants created.`);
        }
      } catch (imgErr) {
        console.error(`   ⚠️ Image proc failed: ${imgErr.message}`);
      }
    }

    // Clean internal properties before saving
    delete correctedEvent._cleanTextScore;

    cleanItems.push(correctedEvent);
  }

  console.log(`\n📊 QUALITY SUMMARY: ${cleanItems.length} Approved | ${rejectedCount} Rejected`);

  if (cleanItems.length === 0) return;

  // Deduplicar final por source_url
  const uniqueItems = [];
  const seenUrls = new Set();
  for (const item of cleanItems) {
    if (item.source_url && !seenUrls.has(item.source_url)) {
      seenUrls.add(item.source_url);
      uniqueItems.push(item);
    }
  }

  const { error } = await supabase.from('content').upsert(uniqueItems, {
    onConflict: 'source_url',
    ignoreDuplicates: false
  });

  if (error) {
    console.error(`❌ [Database] Mass Deployment Error:`, error.message);
  } else {
    console.log(`✅ [Database] Successfully synced ${uniqueItems.length} high-quality items.`);
  }
}

// Execution logic
if (require.main === module) {
  runOmniScraper().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}

module.exports = { runOmniScraper };
