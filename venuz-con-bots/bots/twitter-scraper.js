// bots/twitter-scraper.js
require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const KEYWORDS = {
  escort: ['escort', 'acompañante', 'sugar', 'onlyfans', 'servicios', '🔞'],
  antro: ['table dance', 'antro', 'discoteca', 'vip', 'botella'],
  motel: ['motel', 'habitación', 'hospedaje'],
  transporte: ['taxi', 'uber'],
  alert: ['alcohílimetro', 'tráfico', 'accidente'],
};

const HASHTAGS = [
  '#PuertoVallarta',
  '#EscortsPV',
  '#AntrosPV',
  '#Jalisco',
  '#Nightlife',
  '#ContentCreator',
];

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w.toLowerCase()))) {
      return category;
    }
  }
  return 'other';
}

function extractCoords(text) {
  const regex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  const match = text.match(regex);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return { lat: 20.6296, lng: -105.2581 };
}

async function scrapeTwitter() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    for (const hashtag of HASHTAGS) {
      try {
        const url = `https://twitter.com/search?q=${encodeURIComponent(hashtag)}&f=live`;
        console.log(`🔍 Scrapeando: ${hashtag}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

        const tweets = await page.$$('[data-testid="tweet"]');
        console.log(`📊 Encontrados: ${tweets.length} tweets`);

        for (let i = 0; i < Math.min(tweets.length, 10); i++) {
          try {
            const text = await page.evaluate(
              (el) => el.innerText,
              tweets[i]
            );

            if (!text || text.length < 10) continue;

            const category = detectCategory(text);
            const coords = extractCoords(text);
            const data = await page.evaluate(
              (el) => {
                const link = el.querySelector('a[href*="/status/"]');
                const img = el.querySelector('img[src*="pbs.twimg.com/media"]');
                return {
                  url: link ? link.href : null,
                  image_url: img ? img.src : null
                };
              },
              tweets[i]
            );

            await db.from('content').insert({
              source: 'twitter',
              title: text.substring(0, 100),
              description: text,
              author: 'twitter_user',
              category,
              lat: coords.lat,
              lng: coords.lng,
              location_text: hashtag,
              keywords: [hashtag],
              url: data.url,
              image_url: data.image_url,
              relevance_score: 0.7,
            });
          } catch (err) {
            console.error('Error procesando tweet:', err.message);
          }
        }
      } catch (err) {
        console.error(`❌ Error con ${hashtag}:`, err.message);
      }
    }

    console.log('✅ Twitter scrape completado');
  } finally {
    await browser.close();
  }
}

scrapeTwitter();
module.exports = { scrapeTwitter };
