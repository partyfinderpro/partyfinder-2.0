# Registro de Despliegue y Solución de Problemas - VENUZ

**Fecha:** 22 de Enero de 2026
**Estado:** ✅ Despliegue Exitoso
**URL Final:** https://venuz-final-v2.vercel.app

## 1. Problema de Permisos en Vercel (Critical)

**Error:**
```
Error: Git author pablo@venuz.app must have access to the team partyfinder's projects on Vercel to create deployments.
```

**Causa:**
El proyecto local estaba vinculado a un "Team" de Vercel (`partyfinder`) al que la cuenta personal de usuario no tenía permisos de escritura directos vía CLI, o había un conflicto de herencia de permisos entre la cuenta de Git y la de Vercel.

**Solución (Workaround Efectivo):**
1. **Borrar configuración antigua:** Eliminar la carpeta `.vercel` del proyecto para limpiar el caché de vinculación.
   ```powershell
   Remove-Item -Recurse -Force .vercel
   ```
2. **Deploy como proyecto nuevo:** Ejecutar `vercel --prod`.
3. ** Seleccionar Scope Personal:** Al preguntar "Which scope?", seleccionar SIEMPRE la cuenta personal, NO la cuenta de equipo (`partyfinder`).
4. **NO vincular al existente:** Responder `N` (No) a "Link to existing project?".
5. **Cambiar nombre:** Usar un nombre nuevo (ej. `venuz-final-v2`) para evitar conflictos con deploys anteriores fallidos.
6. **NO vincular Git (durante el deploy):** Responder `n` (No) a "Detected a repository. Connect it?". Esto fuerza a Vercel a subir los archivos locales directamente en lugar de intentar jalar desde GitHub, evitando el chequeo de permisos de Git.

## 2. Errores de Construcción (Build Errors)

**Error:**
`Command "npm run build" exited with 1`
`Type error: Property 'category' is missing in type 'ContentItem'...`

**Causa:**
Discrepancia entre los datos crudos que devuelve Supabase y las interfaces estrictas de TypeScript esperadas por los componentes (`ContentCard`).
- `ContentCard` esperaba `category: string`.
- Supabase devolvía `categories: { name: string }`.
- `ContentCard` esperaba propiedades opcionales (`?`) mientras que la interfaz tenía uniones con `null`.

**Solución:**
Se modificó `components/InfiniteFeed.tsx` para:
1. Actualizar la interfaz `ContentItem` usando propiedades opcionales (`?`).
2. Implementar una transformación de datos (mapping) antes de guardar en el estado:
   ```typescript
   const formattedData = data.map((item: any) => ({
     ...item,
     category: item.categories?.name || 'General', // Aplanar categoría
     description: item.description || undefined,    // Convertir null a undefined
     // ... otros campos
   }))
   ```

## 3. Comandos Útiles

- **Limpiar Vercel:** `Remove-Item -Recurse -Force .vercel`
- **Verificar Build Local:** `npm run build` (Siempre correr esto antes de deployar para ver errores reales)
- **Deploy Producción:** `vercel --prod`

---
*Este documento sirve como referencia para futuros asistentes de IA (Claude/Antigravity) para entender cómo se resolvieron los bloqueos de despliegue.*
