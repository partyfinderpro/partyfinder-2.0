# ⚡ INSTRUCCIONES RÁPIDAS - VENUZ

## 🎯 QUÉ HACER AHORA (Paso a Paso)

### PASO 1: Descargar Todo ✅

Voy a darte un link para descargar TODO el proyecto completo.

**Descarga la carpeta `venuz-app` completa**

---

### PASO 2: Subir a GitHub 📤

**DESDE TU CELULAR (App GitHub):**

1. Abre la app de GitHub
2. Ve a tu repositorio: `partyfinder-2.0`
3. Toca el botón **"+"** arriba a la derecha
4. Selecciona **"Upload files"**
5. Selecciona **TODOS** los archivos de la carpeta `venuz-app`
6. Escribe en "Commit message": `VENUZ v1.0 - App completa`
7. Toca **"Commit changes"**

**¡LISTO!** GitHub tiene todo el código.

---

### PASO 3: Configurar Supabase 🗄️

1. Ve a [supabase.com](https://supabase.com) desde tu celular
2. Crea cuenta (gratis)
3. **"New Project"**
   - Nombre: `venuz`
   - Database Password: (guárdala)
   - Region: South America
4. Espera 2 minutos a que se cree
5. Ve a **SQL Editor** (icono </>)
6. Toca **"New query"**
7. Copia TODO el contenido de `supabase/schema.sql`
8. Pégalo en el editor
9. Toca **"Run"** ▶️

**¡Listo!** Base de datos creada.

10. Ve a **Settings** → **API**
11. Copia:
    - `Project URL`
    - `anon public key`
    
**GUÁRDALOS** - los necesitas en el siguiente paso.

---

### PASO 4: Desplegar en Vercel 🚀

1. Ve a [vercel.com](https://vercel.com)
2. **"Sign Up"** con GitHub
3. **"Import Project"**
4. Busca `partyfinder-2.0`
5. **"Import"**
6. En **"Configure Project"**:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (dejar como está)
7. **Agrega Variables de Entorno** (tocando "Environment Variables"):
   ```
   NEXT_PUBLIC_SUPABASE_URL = [pega tu Project URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [pega tu anon key]
   NEXT_PUBLIC_APP_URL = https://venuz.love
   ```
8. Toca **"Deploy"**

**¡Espera 2-3 minutos!**

---

### PASO 5: ¡VER TU APP EN VIVO! 🎉

Cuando termine el deploy, Vercel te dará un link como:
`https://partyfinder-2-0-xxx.vercel.app`

**¡Ábrelo y verás VENUZ funcionando!**

---

## 🔄 ¿QUÉ SIGUE?

### Para Modificaciones:

1. Dime qué quieres cambiar
2. Yo te doy los archivos actualizados
3. Los subes a GitHub (reemplazas los viejos)
4. Vercel actualiza automáticamente en 1 minuto

### Para Scrapers:

Los scrapers YA están programados pero necesitas:
1. Activarlos en Vercel (te ayudo cuando quieras)
2. Personalizar sitios a scrapear (lo hacemos juntos)

### Para Dominio venuz.love:

Cuando quieras conectar tu dominio:
1. Ve a Vercel → Settings → Domains
2. Agrega `venuz.love`
3. Te digo qué DNS configurar

---

## 📞 Si Algo Sale Mal

**Opción 1:** Lee el archivo `README.md` (tiene TODO explicado)

**Opción 2:** Inicia nuevo chat y dime:
"Proyecto VENUZ - [describe el problema]"

---

## ✅ CHECKLIST

- [ ] Archivos descargados
- [ ] Subidos a GitHub
- [ ] Supabase configurado
- [ ] Desplegado en Vercel
- [ ] App funcionando en vivo

**Cuando tengas las 5 marcadas, ¡VENUZ ESTÁ VIVO!** 🎉🔥

---

## 💡 Tips Importantes

1. **Guarda tus credenciales de Supabase** (URL y keys)
2. **No compartas tu anon key públicamente**
3. **El primer deploy tarda 2-3 min, los siguientes 30 segundos**
4. **Si cambias algo en GitHub, Vercel actualiza solo**

---

**¡VENUZ está listo para conquistar el mundo! 🚀**

¿Preguntas? ¡Pregúntame!
