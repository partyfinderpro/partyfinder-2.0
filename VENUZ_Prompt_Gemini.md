# 🤖 PROMPT PARA GEMINI / CLAUDE (Misión: Diagnóstico Profundo)

**(Copia y pega este texto completo en tu chat con Gemini o el otro asistente)**

---

**ESTOY TENIENDO UN PROBLEMA CRÍTICO EN PRODUCCIÓN CON NEXT.JS + VERCEL + SUPABASE**
Necesito tu capacidad de diagnóstico experto. He intentado todo, incluyendo hardcodear credenciales, pero el feed sigue vacío.

### 📋 Contexto Técnico
- **Stack:** Next.js 14 (App Router), Supabase, Vercel Deploy.
- **Frontend:** `app/page.tsx` usa `useEffect` para llamar a `supabase.from('content').select('*')`.
- **Problema:** En local `npm run dev` funciona perfecto (trae 526 items). En producción (Vercel) el array `data` llega vacío `[]` o la query falla silenciosamente.

### 🛠️ Lo que ya hicimos (Diagnóstico y Fixes)
1. **Detectamos Variables "Fantasma":** Vercel parecía estar inyectando una `NEXT_PUBLIC_SUPABASE_URL` antigua (`rumilv...`) en lugar de la nueva (`jbrmziwo...`).
2. **Aplicamos "Nuclear Fix":** Modificamos `lib/supabaseClient.ts` para **hardcodear** la URL y Key correcta, eliminando `process.env` por completo para descartar problemas de variables de entorno.
   ```typescript
   // lib/supabaseClient.ts
   const supabaseUrl = 'https://jbrmziwosyeructvlvrq.supabase.co'; // Hardcoded
   export const supabase = createClient(supabaseUrl, key);
   ```
3. **Normalización de Datos:** Corregimos las categorías en la DB (todas minúsculas) para coincidir con los filtros del frontend.
4. **Verificación RLS:** Las políticas RLS de Supabase están abiertas para lectura pública (`anon`).

### 🚨 Situación Actual
A pesar del "Nuclear Fix" y el redeploy exitoso en Vercel, **el feed sigue vacío**.
- No hay errores 500 explícitos visibles en UI.
- La consola del navegador mostraba previamente `ERR_NAME_NOT_RESOLVED` con la URL vieja (antes del fix nuclear).
- Ahora, con el fix nuclear, si sigue fallando, es inexplicable.

### ❓ Preguntas para ti, Analista:
1. **¿Caching Agresivo Vercel/Next?** ¿Es posible que Vercel esté sirviendo una versión "cacheada" del bundle JS (`main-xyz.js`) que todavía contiene el código viejo, ignorando mi nuevo commit? ¿Cómo fuerzo una purga total?
2. **Hydration Mismatch:** Vimos errores `#418` de React. ¿Podría un fallo de hidratación estar "desmontando" el contenido del feed antes de que se vea?
3. **CORS / Headers:** ¿Supabase podría estar bloqueando el dominio `vercel.app` silenciosamente si no está explícitamente en la lista de "Allowed Origins" en el dashboard de Supabase (Auth settings)?
4. **¿Sugerencia de Debug?** ¿Qué comando o `console.log` específico debería poner en producción para ver *exactamente* qué URL y Key está usando el cliente compilado en el navegador de un usuario final?

**Ayúdame a encontrar al fantasma en la máquina.**

---
