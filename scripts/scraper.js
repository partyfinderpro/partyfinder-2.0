const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Bots Army Imports
const TheWatcher = require('./bots/watcher');
const TheHunter = require('./bots/hunter');
const TheSeducer = require('./bots/seducer');
const TheSpecialist = require('./bots/specialist');
const TheSocialite = require('./bots/social_events');
// const ApifyHunter = require('./bots/apify_hunter'); // Disabled until token fixed
const GooglePlacesHunter = require('./bots/google_places'); // NEW: Google Places API

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

    // 3. Apply TikTok Algorithm & Preparation
    console.log(`\n🧠 Processing ${allResults.length} items through TikTok Engine...`);
    const processedContent = allResults.map(item => {
      const now = new Date().toISOString();
      const itemWithTime = { ...item, scraped_at: item.scraped_at || now };
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

  // Deduplicar por source_url antes de enviar (evita error "cannot affect row a second time")
  const uniqueItems = [];
  const seenUrls = new Set();
  for (const item of items) {
    if (item.source_url && !seenUrls.has(item.source_url)) {
      seenUrls.add(item.source_url);
      uniqueItems.push(item);
    }
  }

  console.log(`📦 Sending ${uniqueItems.length} unique items (filtered ${items.length - uniqueItems.length} duplicates)`);

  const { error } = await supabase.from('content').upsert(uniqueItems, {
    onConflict: 'source_url',
    ignoreDuplicates: true // Cambiar a true para ignorar duplicados existentes
  });

  if (error) {
    console.error(`❌ [Database] Mass Deployment Error:`, error.message);
  } else {
    console.log(`✅ [Database] Synchronized ${uniqueItems.length} items with the Cloud.`);
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
