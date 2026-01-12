// bots/telegram-scraper.js
require('dotenv').config({ path: '.env.local' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;
const TELEGRAM_PHONE = process.env.TELEGRAM_PHONE;
const TELEGRAM_PASSWORD = process.env.TELEGRAM_PASSWORD;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to upload media to Supabase
async function uploadMedia(buffer, mimeType = 'image/jpeg') {
  try {
    const filename = `telegram_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // First ensure bucket exists (optional, depends on permissions)
    // await db.storage.createBucket('content', { public: true }); 

    const { data, error } = await db.storage
      .from('content')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.log('⚠️ Upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = db.storage
      .from('content')
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('❌ Media handling error:', err.message);
    return null;
  }
}

const KEYWORDS = {
  escort: ['escort', 'acompañante', 'sugar', 'onlyfans', 'content creator', 'servicios', 'atiende', 'disponible', '🔞', '18+'],
  antro: ['table dance', 'antro', 'discoteca', 'bar', 'club', 'fiesta', 'raves', 'vip', 'botella'],
  motel: ['motel', 'habitación', 'hospedaje', 'suite', 'por horas'],
  transporte: ['taxi', 'uber', 'transporte', 'viaje'],
  alert: ['alcohílimetro', 'tráfico', 'accidente', 'cierre', 'retén']
};

const CHANNELS = [
  'escortspuertovallarta',
  'antrosjaliscooficial',
  'motelesjaliscooficial',
  'tablesdancepv',
];

const PV_CENTER = { lat: 20.6296, lng: -105.2581 };

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
  return PV_CENTER;
}

function extractKeywords(text) {
  const hashtags = (text.match(/#\w+/g) || []).map(h => h.substring(1));
  const mentions = (text.match(/@\w+/g) || []).map(m => m.substring(1));
  return [...hashtags, ...mentions];
}

async function scrapeChannels() {
  if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
    console.log('⚠️ TELEGRAM_API_ID o TELEGRAM_API_HASH no configurados');
    return;
  }

  try {
    const session = new StringSession(process.env.TELEGRAM_SESSION || '');

    const client = new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: async () => TELEGRAM_PHONE,
      password: async () => TELEGRAM_PASSWORD,
      onError: (err) => console.log('Telegram error:', err),
    });

    console.log('✅ Telegram conectado');

    for (const channel of CHANNELS) {
      try {
        console.log(`📡 Scrapeando: ${channel}`);
        const entity = await client.getEntity(channel);
        const messages = await client.getMessages(entity, { limit: 50 });

        for (const msg of messages) {
          if (!msg.text) continue;

          const category = detectCategory(msg.text);
          const coords = extractCoords(msg.text);
          const keywords = extractKeywords(msg.text);

          // Handle media
          let imageUrl = null;
          if (msg.media && (msg.media.className === 'MessageMediaPhoto' || msg.media.photo)) {
            try {
              console.log('📸 Descargando foto...');
              const buffer = await client.downloadMedia(msg, {});
              if (buffer) {
                imageUrl = await uploadMedia(buffer);
                if (imageUrl) console.log('✅ Foto subida:', imageUrl);
              }
            } catch (mediaErr) {
              console.error('⚠️ Error procesando media:', mediaErr.message);
            }
          }

          await db.from('content').insert({
            source: 'telegram',
            title: msg.text.substring(0, 100),
            description: msg.text,
            image_url: imageUrl,
            author: msg.from_id?.user_id?.toString() || 'anonymous',
            category,
            lat: coords.lat,
            lng: coords.lng,
            location_text: channel,
            keywords,
            url: `https://t.me/${channel}/${msg.id}`,
            relevance_score: 0.8,
          });
        }

        console.log(`✅ ${channel}: ${messages.length} mensajes procesados`);
      } catch (err) {
        console.error(`❌ Error en ${channel}:`, err.message);
      }
    }

    await client.disconnect();
    console.log('✅ Scrape Telegram completado');
  } catch (err) {
    console.error('❌ Error crítico:', err);
  }
}

scrapeChannels();
module.exports = { scrapeChannels };
