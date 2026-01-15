# 🤖 BOTS DE SCRAPING - INSTRUCCIONES

## ¿QUÉ SE CREÓ?

✅ `.env.local` - Archivo de configuración con credenciales
✅ `/bots/telegram-scraper.js` - Bot para Telegram
✅ `/bots/twitter-scraper.js` - Bot para Twitter  
✅ `/jobs/scheduler.js` - Ejecuta bots automáticamente
✅ `package.json` - Actualizado con dependencias

---

## PASO 1: INSTALAR DEPENDENCIAS

```bash
npm install
```

(Tarda 5-10 minutos la primera vez)

---

## PASO 2: CONFIGURAR CREDENCIALES TELEGRAM (OPCIONAL)

Si quieres usar Telegram, edita `.env.local`:

```
TELEGRAM_API_ID=tu_api_id
TELEGRAM_API_HASH=tu_api_hash
TELEGRAM_PHONE=+34xxxxxx
TELEGRAM_PASSWORD=tu_password
```

(De: https://my.telegram.org/apps)

---

## PASO 3: EJECUTAR BOTS

### Opción A: Ejecutar una sola vez

**Telegram:**
```bash
npm run scrape:telegram
```

**Twitter:**
```bash
npm run scrape:twitter
```

### Opción B: Ejecutar automáticamente (RECOMENDADO)

```bash
npm run scheduler
```

Esto ejecutará:
- 📡 Telegram cada 2 horas
- 🐦 Twitter cada 4 horas

---

## ¿QUÉ HACE CADA BOT?

### Telegram Scraper
- Busca en canales: escortspuertovallarta, antrosjaliscooficial, etc
- Detecta categorías: escort, antro, motel, transporte, alert
- Extrae ubicación (lat, lng)
- Guarda en Supabase tabla "content"

### Twitter Scraper  
- Busca hashtags: #PuertoVallarta, #EscortsPV, #AntrosPV, etc
- Detecta contenido adulto, vida nocturna
- Extrae enlaces
- Guarda en Supabase

---

## DÓNDE VES LOS DATOS

1. Ve a: https://supabase.com
2. Login en tu proyecto
3. Click "Table Editor"
4. Abre tabla "content"
5. Verás todos los tweets/mensajes scrapeados

---

## AGREGAR MÁS CANALES TELEGRAM

En `/bots/telegram-scraper.js`, línea ~30, edita:

```javascript
const CHANNELS = [
  'escortspuertovallarta',
  'antrosjaliscooficial',
  'motelesjaliscooficial',
  'tablesdancepv',
  // AGREGA AQUÍ
  'tu_nuevo_canal',
];
```

---

## AGREGAR MÁS HASHTAGS TWITTER

En `/bots/twitter-scraper.js`, línea ~28, edita:

```javascript
const HASHTAGS = [
  '#PuertoVallarta',
  '#EscortsPV',
  // AGREGA AQUÍ
  '#TuHashtag',
];
```

---

## TROUBLESHOOTING

**Error: "TELEGRAM_API_ID is required"**
→ Configura Telegram en .env.local o usa solo Twitter

**Error: "Cannot find module 'puppeteer'"**
→ Ejecuta: `npm install`

**Supabase no guarda nada**
→ Verifica SUPABASE_URL y SUPABASE_ANON_KEY en .env.local

---

## NEXT STEPS

1. Instala dependencias: `npm install`
2. Configura .env.local si quieres Telegram
3. Ejecuta: `npm run scheduler`
4. Abre Supabase y ve los datos llegando en vivo

¡Listo! 🚀
