# 🧪 INSTRUCCIONES DE EJECUCIÓN VENUZ - PRUEBA COMPLETA

La Fase 1 (Buscador) y Fase 2 (Disco Duro) están **completadas**.
Ahora, vamos a hacer la **Prueba de Fuego**: Subir una foto real y encontrarla con el buscador.

## PASO 1: Arrancar Aplicación (Local)

1.  En tu terminal de VS Code:
    ```powershell
    npm run dev
    ```
2.  Abre `http://localhost:3000`.

## PASO 2: Subir Contenido Real (Creator Mode)

1.  Ve a: **`http://localhost:3000/admin/upload`**.
2.  Verás una pantalla negra elegante "Subir Contenido".
3.  **Sube una foto o video:** Arrástrala al recuadro o haz clic. (Recomendado: Video vertical de celular).
4.  Llena los datos:
    *   **Título:** "Prueba Venuz 1"
    *   **Ciudad:** Puerto Vallarta (o la que te quede cerca para probar el GPS).
    *   **Categoría:** "Club" o "Modelos".
5.  Dale al botón **"Publicar Ahora"**.
6.  Debería decir "¡Publicado con éxito!".
    *   *Nota:* Si carga un rato y luego confirma, es que el Storage funcionó perfecto.

## PASO 3: Encontrarlo en el Feed

1.  Vuelve al inicio: **`http://localhost:3000`**.
2.  Si subiste video, debería aparecerte en el feed (quizás tengas que recargar o scrollear un poco).
3.  **Prueba el Filtro:**
    *   Abre el botón "Más" (Filtros).
    *   Pon distancia "100 km" (para asegurar que salga).
    *   Dale "Aplicar".
    *   Tu foto/video debería salir ahí.

## ¿Qué sigue si todo funciona?
Si lograste subir y ver tu contenido, **YA TIENES UNA RED SOCIAL FUNCIONAL**.
Lo único que falta es mandar esto al mundo:

```powershell
git add .
git commit -m "feat: complete creator engine and advanced search"
git push
```
(Y Vercel lo desplegará automáticamente en `partyfinder-2-0.vercel.app`).
