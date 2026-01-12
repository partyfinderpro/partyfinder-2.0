// jobs/scheduler.js
require('dotenv').config({ path: '.env.local' });
const cron = require('node-cron');
const { scrapeChannels } = require('../bots/telegram-scraper');
const { scrapeTwitter } = require('../bots/twitter-scraper');

console.log('🚀 Iniciando scheduler...');

// Telegram cada 2 horas
cron.schedule('0 */2 * * *', () => {
  console.log('\n🤖 [CRON] Iniciando Telegram scrape...');
  scrapeChannels().catch(console.error);
});

// Twitter cada 4 horas
cron.schedule('0 */4 * * *', () => {
  console.log('\n🐦 [CRON] Iniciando Twitter scrape...');
  scrapeTwitter().catch(console.error);
});

console.log('✅ Cron jobs activos:');
console.log('  📡 Telegram: cada 2 horas');
console.log('  🐦 Twitter: cada 4 horas');

// Mantener el proceso vivo
process.on('SIGINT', () => {
  console.log('\n❌ Scheduler detenido');
  process.exit(0);
});
