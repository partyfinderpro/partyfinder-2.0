# 🛡️ Auditoría de Seguridad y Resiliencia VENUZ PWA

**Arquitecto:** Antigravity AI
**Fecha:** 22 Enero 2026
**Nivel de Riesgo Actual:** 🟠 MEDIO (Faltan headers de seguridad y PWA)

Este documento detalla el diagnóstico y el plan de implementación para blindar VENUZ v2.0.

---

## 1. 🌐 Seguridad Frontend (PWA & Client-Side)

### A. Diagnóstico Actual
- **Estado:** PWA no configurada (falta `next-pwa` y manifiesto).
- **Service Workers:** No existen. La app no funciona offline.
- **Headers:** No configurados. Vulnerable a Clickjacking y XSS simple.
- **CSP:** Inexistente. Permite cargar scripts de cualquier fuente.

### B. Plan de Implementación PWA (Resiliencia)
Para que la app funcione sin internet ("Modo Avión" o "Club sin señal"):

1. **Instalar dependencias:**
   ```bash
   npm install next-pwa
   npm install --save-dev webpack
   ```
2. **Configurar `next.config.js`:** (Ver sección de código abajo).
3. **Generar Iconos:** Crear archivos `manifest.json` y los iconos en `/public`.

### C. Content Security Policy (CSP) Estricta
Implementaremos una CSP vía `middleware.ts` que:
- Bloquee scripts no autorizados.
- Bloquee iframes de sitios no confiables.
- Fuerce HTTPS.

**Snippet para Middleware (Implementado en paso siguiente):**
```typescript
const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`
```

---

## 2. 🔐 Blindaje Backend y API (Supabase)

### A. Diagnóstico
- **Auth:** Supabase Auth (Seguro por defecto, usa JWT).
- **Rate Limiting:** Básico de Supabase. Vulnerable a ataques distribuidos selectivos.
- **Datos Sensibles:** Las URLs de imágenes son públicas.

### B. Estrategia de Protección

#### 1. Rate Limiting (Capa Aplicación)
Implementar validación simple en Middlewares de Next.js o usar **Supabase Edge Functions** para lógica crítica.
*Recomendación:* Usar **Cloudflare WAF** (Gratuito) como primera línea de defensa para Rate Limiting sin tocar código.

#### 2. Autenticación Robusta
Asegurar que todas las tablas tengan políticas **RLS (Row Level Security)** activas.
```sql
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON content FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON content FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));
```

#### 3. Bóveda de Identidad (Storage)
Para Ids de modelos/escorts:
- Crear Bucket Privado: `venuz-private-docs`
- Política de acceso: Solo el propio usuario o admin puede leer.
- Acceso: Mediante **Signed URLs** que expiran en 60 segundos.

---

## 3. ⚡ Rendimiento y Escalabilidad

### A. Optimizaciones Críticas (Core Web Vitals)
1. **LCP (Largest Contentful Paint):**
   - Usar `<Image priority />` en la primera imagen del feed (`InfiniteFeed.tsx`).
   - Usar formatos AVIF/WebP (Next.js lo hace automático si se configura).

2. **Cache-Control:**
   - Configurar `stale-while-revalidate` en los headers de respuesta para contenido estático.

---

## 4. 🥷 Estrategia "Hacker" - Implementación Inmediata

### 1. El Escudo Perimetral (Cloudflare)
**Acción:** Cambiar los DNS de tu dominio (`venuz.app`) para que apunten a Cloudflare.
**Beneficio:** SSL automático, protección DDoS gratuita, y ocultamiento de la IP real de Vercel.

### 2. Monitoreo (Sentry)
**Acción:** Instalar Sentry en el proyecto Next.js.
```bash
npx @sentry/wizard@latest -i nextjs
```
Esto te avisará por email/Slack instantáneamente si un usuario tiene un error crítico.

---

## 🚀 Próximos Pasos (En orden de prioridad)

1. **[HECHO]** Se creará el archivo `middleware.ts` con headers de seguridad militar.
2. **[PENDIENTE]** Instalar `next-pwa` para activar modo offline.
3. **[PENDIENTE]** Configurar Cloudflare (Manual en panel de control).
