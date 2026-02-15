# Referencia Maestra: URLs, APIs y Credenciales
**Fecha de Actualización:** 15 de Febrero, 2026

## 🌐 URLs Principales
| Recurso | URL | Notas |
|---------|-----|-------|
| **Producción (Live)** | `https://partyfinder-2-0.vercel.app` | Dominio principal activo |
| **Repositorio GitHub** | `https://github.com/partyfinderpro/partyfinder-2.0` | Rama `main` es producción |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/jbrmziwosyeructvlvrq` | ID: `jbrmziwosyeructvlvrq` |
| **Vercel Project** | `https://vercel.com/partyfinder/partyfinder-2-0` | Scope: `partyfinder` |

## 🔌 API Endpoints Críticos
Estos endpoints son el corazón del sistema. Requieren `CRON_SECRET` o autenticación Telegram.

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/telegram/webhook` | POST | **Cerebro del Bot**. Recibe mensajes y gestiona respuestas IA. |
| `/api/cron/run-sce` | GET | **Scraper Engine**. Ejecuta la recolección de eventos/jobs. |
| `/api/cron/brain` | GET | **Reporte Diario**. Genera el resumen para el CEO (Pablo). |
| `/api/feed` | GET | **Feed Principal**. Algoritmo Highway (JSON). |
| `/api/analytics/ab` | POST | **A/B Testing**. Recolecta métricas de experimentos. |

## 🔑 Variables de Entorno (Environment Variables)
Estas claves deben estar configuradas en Vercel (`Settings > Environment Variables`) y en `.env.local` para desarrollo.

### 🧠 Inteligencia Artificial
*   `GROQ_API_KEY`: Motor principal (Llama 3 70b via Groq).
*   `GEMINI_API_KEY`: Motor de respaldo y chat general (Google Gemini 1.5).
*   `TAVILY_API_KEY`: Búsqueda web para el agente.
*   `XAI_API_KEY`: (Pendiente) Para integración futura con Grok.

### 🗄️ Base de Datos & Backend
*   `NEXT_PUBLIC_SUPABASE_URL`: URL pública de Supabase.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave pública (segura para cliente).
*   `SUPABASE_SERVICE_ROLE_KEY`: **CRÍTICA**. Clave maestra (solo servidor).
*   `CRON_SECRET`: Protege los endpoints de cron jobs.

### 🤖 Telegram Bot
*   `TELEGRAM_BOT_TOKEN`: Token del bot (`@Venuz...`).
*   `TELEGRAM_CHAT_ID`: ID del chat de admin (Pablo).

## 📂 Estructura de Carpetas (Post-Limpieza)
*   `/app`: Código fuente Next.js (Rutas, API).
*   `/components`: Componentes React reutilizables.
*   `/lib`: Lógica de negocio (IA, Supabase, Utils).
*   `/docs/reports`: Historial de reportes y auditorías anteriores.
*   `/logs`: Logs de ejecución y errores (no subir a git).
*   `/scripts`: Scripts de mantenimiento y scrapers Python.
*   `CONSOLIDATED_HISTORY.md`: **Bitácora Maestra** de problemas y soluciones.
