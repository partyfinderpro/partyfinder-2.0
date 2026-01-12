# 🔥 VENUZ - Plataforma de Entretenimiento Adulto

## 📋 Descripción

VENUZ es una Progressive Web App (PWA) estilo TikTok para entretenimiento adulto con:
- ✅ Feed infinito con scroll vertical
- ✅ Scrapers regionales automáticos
- ✅ Geo-localización (contenido cercano primero)
- ✅ Verificación de edad
- ✅ Base de datos con Supabase
- ✅ Diseño sexy inspirado en Playboy (oscuro, sensual)

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS (tema personalizado VENUZ)
- **Animaciones**: Framer Motion
- **Base de Datos**: Supabase (PostgreSQL)
- **Scrapers**: Axios + Cheerio
- **Hosting**: Vercel (gratis para empezar)

## 🚀 Configuración Rápida

### 1. Configura Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. En el SQL Editor, ejecuta el archivo `supabase/schema.sql`
4. Copia tu URL y ANON KEY

### 2. Configura Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_URL=https://venuz.love
```

### 3. Instala Dependencias

```bash
npm install
```

### 4. Ejecuta en Local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📤 Subir a GitHub (DESDE LA APP MÓVIL)

### Opción A: Usando GitHub App

1. Abre la app de GitHub
2. Ve a tu repo `partyfinder-2.0`
3. Toca el botón "+"
4. Selecciona "Upload files"
5. Sube TODOS los archivos de esta carpeta
6. Escribe commit: "VENUZ complete app v1"
7. Toca "Commit changes"

### Opción B: Desde Navegador Móvil

1. Ve a github.com/partyfinderpro/partyfinder-2.0
2. Toca "Add file" → "Upload files"
3. Arrastra/sube todos los archivos
4. Commit: "VENUZ complete app v1"

## 🌐 Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. "Import Project"
3. Conecta tu GitHub
4. Selecciona `partyfinder-2.0`
5. Agrega las variables de entorno (.env)
6. Deploy

¡Listo! Tu app estará en línea en 2 minutos.

## 🤖 Scrapers Automáticos

### Ejecutar Scrapers Manualmente

```bash
npm run scrape
```

### Configurar Scrapers Automáticos

Los scrapers están en `scripts/scraper.js`

**Para que corran automáticamente:**

1. **Opción A - Vercel Cron Jobs (GRATIS):**
   - Crea `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/scrape",
       "schedule": "0 */6 * * *"
     }]
   }
   ```
   - Corre cada 6 horas

2. **Opción B - GitHub Actions (GRATIS):**
   - Los scrapers corren automáticamente cada día
   - Ya configurado en `.github/workflows/scraper.yml`

### Personalizar Scrapers

Edita `scripts/scraper.js`:
- Agrega sitios a `SCRAPE_TARGETS`
- Personaliza funciones `scrapeClubs()`, `scrapeServices()`
- Basado en estructura de ThePornDude

## 📊 Estructura del Proyecto

```
venuz-app/
├── app/
│   ├── globals.css          # Estilos globales (tema VENUZ)
│   ├── layout.tsx            # Layout con efectos de fondo
│   └── page.tsx              # Página principal + verificación edad
├── components/
│   ├── InfiniteFeed.tsx      # Feed estilo TikTok
│   └── ContentCard.tsx       # Tarjeta de contenido sexy
├── lib/
│   └── supabase.ts           # Cliente de Supabase
├── scripts/
│   └── scraper.js            # Sistema de scrapers regionales
├── supabase/
│   └── schema.sql            # Schema de base de datos
├── public/
│   └── manifest.json         # PWA manifest
├── package.json
├── tailwind.config.js        # Tema VENUZ personalizado
└── next.config.js
```

## 🎨 Tema de Diseño

**Colores VENUZ:**
- Negro: `#0a0a0a`
- Rosa: `#ff1493` (Deep Pink)
- Rojo: `#dc143c` (Crimson)
- Dorado: `#ffd700` (Gold)

**Fuentes:**
- Display: Playfair Display (elegante, serif)
- Body: Montserrat (moderna, sans-serif)

## 📱 Características PWA

- ✅ Instalable en móvil
- ✅ Funciona offline (básico)
- ✅ Pantalla completa
- ✅ Iconos optimizados
- ✅ Tema oscuro

## 🔧 Comandos Útiles

```bash
npm run dev          # Desarrollo local
npm run build        # Build producción
npm run start        # Servidor producción
npm run scrape       # Ejecutar scrapers
npm run lint         # Lint código
```

## 📈 Próximos Pasos

1. ✅ Subir a GitHub
2. ✅ Desplegar en Vercel
3. ⏳ Agregar más scrapers personalizados
4. ⏳ Configurar dominio venuz.love
5. ⏳ Activar scrapers automáticos
6. ⏳ Agregar analytics
7. ⏳ Sistema de registro (opcional)

## 🐛 Solución de Problemas

**Error de Supabase:**
- Verifica que las variables de entorno estén correctas
- Asegúrate de haber ejecutado el schema.sql

**Scrapers no funcionan:**
- Algunos sitios bloquean scrapers (normal)
- Usa APIs de afiliados cuando sea posible
- Agrega delays entre requests

**Imágenes no cargan:**
- Verifica que los dominios estén en `next.config.js`
- Usa placeholders de Unsplash como fallback

## 💰 Costos

**GRATIS (primeros meses):**
- Vercel Free: 100GB bandwidth
- Supabase Free: 500MB database
- GitHub: Gratis

**Cuando crezcas:**
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- **Total: ~$45/mes** para 100k+ usuarios

## 📞 Soporte

Si tienes problemas:
1. Revisa este README
2. Pregúntame en el próximo chat: "Proyecto VENUZ - [tu problema]"

---

**¡VENUZ está listo para despegar! 🚀🔥**

Hecho con 💕 por Claude & Pablovichk
