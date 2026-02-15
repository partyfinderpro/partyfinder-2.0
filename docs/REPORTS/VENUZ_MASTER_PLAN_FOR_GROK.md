# 🦅 VENUZ MASTER PLAN & HANDOFF (ANTIGRAVITY -> GROK)

**Fecha:** 2026-02-09
**Estado del Sistema:** 🟢 DEPLOY DESBLOQUEADO (Vercel Fix Aplicado)
**URL Producción:** `https://partyfinder-2-0.vercel.app`
**URL Casino Mode (Preview):** `https://partyfinder-2-0.vercel.app/casino-vip`

---

## 🛑 ANTECEDENTES CRÍTICOS (LEER PRIMERO)
El proyecto sufrió un bloqueo de despliegue silencioso debido a **Cron Jobs demasiado frecuentes** para el plan Hobby de Vercel.
- **Solución Aplicada:** Se cambiaron todos los crons a frecuencia diaria (`0 7 * * *`).
- **Lección:** NO agregar tareas programadas menores a 24h hasta migrar a Pro.

---

## 🏗️ INFRAESTRUCTURA ACTUAL
1.  **Backend:** Supabase + Next.js API Routes.
2.  **Bot Telegram:** `/api/telegram/webhook` (Node.js runtime).
    - Fix Reciente: Regex flexible para comandos `/tarea`.
    - Estado: **OPERATIVO**.
3.  **Frontend:** Next.js 14 + Tailwind CSS.
    - Nuevo Sistema de Diseño: `LuxuryUI` (Botones dorados, Cards ornamentadas).
    - Nuevo Fondo: `DynamicCasinoBackground` (Videos + Partículas).

---

## 📋 LISTA MAESTRA DE PENDIENTES (TU MISIÓN, GROK)

### 1. 🎨 FRONTEND: LA GRAN TRANSFORMACIÓN (Prioridad Alta)
El "Modo Casino" existe en `/casino-vip`, pero el resto de la app sigue con el diseño antiguo.
- [ ] **Home Page (`/`)**: Reemplazar el layout actual con `DynamicCasinoBackground` y usar `LuxuryCard` para el feed principal.
- [ ] **Navegación**: Crear un *Bottom Bar* flotante estilo cristal (`glassmorphism`) con iconos dorados activos.
- [ ] **Perfil de Usuario**: Diseñar como una "Membresía VIP" (Tarjeta negra con letras doradas, código QR, nivel de acceso).
- [ ] **Detalle de Evento**: Usar el video de fondo del evento con overlay oscuro y botones de reserva `LuxuryButton` animados.

### 2. 🤖 CEREBRO IA: "DYNAMIC BRAIN" (Prioridad Media)
El bot de Telegram funciona, pero es reactivo. Necesita ser proactivo.
- [ ] **Notificaciones Real-Time**: Conectar Supabase Realtime para que cuando caiga una venta/reserva, el bot avise al canal privado.
- [ ] **Intervención en Feed**: Permitir que desde Telegram (`/boost [id]`) se destaque un evento en el feed principal (cambiando `priority` en DB).
- [ ] **Chat IA Contextual**: Mejorar el prompt de Gemini para que tenga acceso a *métricas en vivo* del negocio (Ventas hoy, usuarios online).

### 3. ⚡ PERFORMANCE & SEO (Prioridad Técnica)
El fondo de video es pesado.
- [ ] **Optimización de Video**: Asegurar que los videos de fondo sean `< 5MB`, formato WebM si es posible.
- [ ] **Low Power Mode**: Detectar si el usuario tiene "Ahorro de Batería" en móvil y pausar las partículas/video (usar API `navigator.getBattery()`).
- [ ] **Lazy Loading**: No cargar el video del casino hasta que el usuario interactúe o scrollee.

### 4. 🧹 LIMPIEZA DE CÓDIGO
- [ ] **Unificar Utils**: Revisar si hay duplicidad entre `lib/utils.ts` y `utils/cn.ts`. Fusionar en uno solo estándar.
- [ ] **Refactor de Cron Jobs**: Crear un endpoint maestro que dispare sub-tareas secuenciales para no depender de múltiples crons de Vercel.

---

## 💡 CONSEJOS TÁCTICOS DE ANTIGRAVITY
1.  **Case Sensitivity:** Windows (Dev) perdona, Vercel (Prod) castiga. Siempre usa `git mv` si renombras carpetas.
2.  **Despliegue:** Si Vercel se atasca de nuevo, usa `vercel --prod --force` desde la terminal. Es el desatascador universal.
3.  **Estilo:** Mantén la paleta `vip-gold` (`#bf953f`) y `vip-purple` (`#240046`). Es la identidad de la marca ahora. No mezcles con azules o verdes genéricos.

¡Buena suerte, Grok! Tienes una base sólida. Haz que VENUZ brille. 💎✨
