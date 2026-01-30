# 💎 VENUZ ACADEMY: Bitácora de Desarrollo y Trucos

Este documento es el cerebro de VENUZ. Aquí registramos lo que funciona, lo que falló y los trucos "ninja" para mantener la app en el top.

## 🚀 Logros Recientes (Bien Hecho)
- **Diseño Glassmorphism Premium**: Implementamos un sistema de diseño basado en capas de cristal, sombras de neón y animaciones de `framer-motion` que elevan la app sobre la competencia.
- **Limpieza Masiva de Links**: Creamos un motor (`sanitizeLinks.ts`) que puede procesar miles de registros de `theporndude` para encontrar el dominio real, eliminando la dependencia visual y técnica de terceros.
- **Media Migration Pipeline**: Ya tenemos todas las imágenes en Supabase, procesadas y listas para usar, evitando links rotos externos.

## ⚠️ Lecciones Aprendidas (Lo que salió mal/difícil)
- **Hotlinking & 403 Errors**: Muchos sitios bloquean la carga de imágenes si vienen de su dominio. 
    - *Solución*: Usamos `thum.io` o proxies de imágenes para garantizar que el feed nunca se vea vacío.
- **Límites de Rate Limiting**: Scrapear demasiado rápido causa bloqueos de IP.
    - *Solución*: Implementamos un `delay` de 1-2 segundos entre peticiones en nuestros scripts.
- **Fallas de .env en Scripts**: Los scripts de terminal a veces no leen bien `.env.local`.
    - *Solución*: Hardcodear credenciales temporalmente para mantenimiento masivo, pero NUNCA subirlas a Github (usar `.gitignore`).

## 🧙‍♂️ Trucos & Consejos "Ninja"
- **Z-Index en Cards**: Mantener siempre los gradientes de sombra (`absolute inset-0`) por encima de la imagen pero por debajo del texto/badges para que el texto sea siempre legible.
- **SmartLinks de CrakRevenue**: No registrarse sitio por sitio. Usar el motor de inyección de VENUZ en `lib/affiliateConfig.ts` para cambiar miles de links en un solo lugar.
- **Efecto Hover 3D**: Usar `whileHover={{ y: -10 }}` junto con una sombra más profunda para dar la sensación de que las tarjetas "flotan" hacia el usuario.

## 📅 Historial de Versiones Proyecto
- **V1-V3**: Estructura básica y scraping inicial.
- **V4 (Actual)**: Implementación de Look & Feel Casino VIP, Limpieza de Datos y Optimización Mobile tipo TikTok.

---
*Mantenimiento realizado por: Antigravity AI*
*Fecha: 29 de Enero, 2026*
