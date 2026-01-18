# 🚀 VENUZ: Plan Maestro de Aceleración (Prompts para Claude)

Usa estos prompts uno por uno para generar el código "pesado" que falta. El backend ya está listo con PostGIS y Vector.

---

## 📝 PROMPT 1: El Cerebro (Script de Embeddings con Gemini)
**Objetivo:** Crear el script que corre en GitHub Actions para leer eventos y generarles su "vector de inteligencia" usando Gemini.

**Copia y pega esto a Claude:**
```text
Necesito crear un script de Node.js robusto llamado `scripts/generate-embeddings.js`.
CONTEXTO:
- Base de datos: Supabase.
- Tabla: `content`.
- Columnas existentes: `id`, `title`, `description`, `category`, `embedding` (tipo vector(1536), actualmente NULL).
- API de IA: Google Gemini (modelo `text-embedding-004` o compatible).

REQUERIMIENTOS:
1. El script debe buscar las filas donde `embedding` IS NULL.
2. Para cada fila, debe combinar `title` + `description` + `category` + `location_text` en un solo texto.
3. Debe enviar ese texto a la API de Google Gemini para obtener el embedding (array de vectores).
4. Debe actualizar la fila en Supabase guardando ese array en la columna `embedding`.
5. Debe procesar en lotes (batches) de 10 para no saturar la API.
6. Manejo de errores robusto: si falla uno, que loguee el error y siga con el siguiente.

Genera el código completo del script y dime qué paquetes nuevos necesito instalar (ej: @google/generative-ai).
```

---

## 🗺️ PROMPT 2: La Cara (Vista de Mapa Interactiva)
**Objetivo:** Crear un componente de mapa que visualice los puntos que la DB ya tiene geolocalizados.

**Copia y pega esto a Claude:**
```text
Quiero crear un componente de React moderno llamado `components/MapView.tsx` para mi PWA en Next.js.
CONTEXTO:
- Estoy usando TailwindCSS y Lucide Icons.
- Tengo los datos de los lugares con `lat` y `lng`.

REQUERIMIENTOS:
1. Usa `react-leaflet` (es ligero y gratis) y OpenStreetMap tiles.
2. El mapa debe centrarse automáticamente en la ubicación del usuario si está disponible, o en un default (Puerto Vallarta).
3. Debe renderizar "Custom Markers" bonitos (no el pin azul default). Usa iconos o colores según la categoría del lugar (ej: Copas para Bar, Sol para Playa).
4. Al hacer clic en un marker, debe abrir un pequeño Popup o Drawer con la info básica del lugar (Foto, Título, botón de "Ver más").
5. El mapa debe ser responsivo y verse increíble en móvil (Dark Mode style).

Dame el código del componente y las instrucciones para integrarlo en `app/page.tsx` dentro de un tab o botón flotante.
```

---

## 👤 PROMPT 3: El Alma (Perfil y Preferencias)
**Objetivo:** Usar la tabla `user_profiles` para guardar qué le gusta al usuario y personalizar el feed.

**Copia y pega esto a Claude:**
```text
Vamos a implementar la lógica de "Preferencias de Usuario" en Supabase.
CONTEXTO:
- Tabla existente: `user_profiles` (id, user_id, preferences jsonb).
- Frontend: Next.js + Supabase Auth.

REQUERIMIENTOS:
1. Crea un componente `PreferencesForm.tsx` que sea un cuestionario visual y divertido (estilo Tinder o swiping, o grid de iconos).
2. Preguntas: "¿Qué buscas hoy?" (Fiesta, Relax, Comida, Aventura). "¿Música?" (Reggaeton, Techno, Banda, Rock).
3. Al guardar, debe hacer un UPSERT en la tabla `user_profiles` guardando esas tags en el JSONB.
4. (Opcional) Proponme una función SQL simple que pueda filtrar la tabla `content` basándose en si la `description` contiene alguna de esas tags (búsqueda de texto simple por ahora).

Dame el código del componente Frontend.
```
