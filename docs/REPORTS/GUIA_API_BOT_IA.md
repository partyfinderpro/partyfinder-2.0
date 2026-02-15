# 🤖 GUÍA: CÓMO OBTENER LA API DE INTELIGENCIA ARTIFICIAL (GEMINI)

Si quieres integrar un Bot de IA en VENUZ (para generar descripciones, chatear, moderar contenido, etc.) usando la misma tecnología que me impulsa a mí, necesitas una **Google Gemini API Key**.

Aquí tienes los pasos exactos para obtenerla **GRATIS**:

## PASO 1: Obtener la Llave (API Key)

1.  Ve a **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Inicia sesión con tu cuenta de Google.
3.  Haz clic en el botón azul grande **"Create API key"**.
4.  Selecciona "Create API key in new project" (o usa uno existente si tienes).
5.  Copia la cadena de texto que empieza con `AIza...`. **Esa es tu llave maestra.**

## PASO 2: Guardarla en tu Proyecto

1.  Vuelve a VS Code.
2.  Abre el archivo `.env.local` (en la raíz de `venuz-app`).
3.  Agrega una nueva línea al final:

```env
GOOGLE_AI_API_KEY=Pega_Tu_Clave_Aqui_AIzaSyD...
```

## PASO 3: Cómo usarla (Ejemplo Rápido)

Si vas a crear un script o bot en **Python** o **Node.js**, instalarías el SDK oficial:

**Para Node.js (Tu proyecto actual):**
`npm install @google/generative-ai`

**Código de ejemplo para tu Bot:**

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Acceder a tu API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

async function runBot() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const prompt = "Escribe una descripción atractiva para un club nocturno en Puerto Vallarta llamado VENUZ.";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log(text);
}

runBot();
```

---

## ℹ️ NOTA IMPORTANTE:
Si tu bot necesita **leer o escribir en la base de datos de VENUZ** (ej: guardar usuarios, leer eventos), NO uses esta API. Para eso necesitas las **Supabase Service Role Keys**.

*   **¿La quieres para pensar/escribir?** -> Usa **Gemini API** (Instrucciones de arriba).
*   **¿La quieres para guardar datos?** -> Usa **Supabase API** (Settings > API en tu Dashboard).
