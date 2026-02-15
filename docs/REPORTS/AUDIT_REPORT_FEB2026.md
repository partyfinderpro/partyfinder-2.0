# Auditoría y Diagnóstico Profundo: VENUZ "Cerebro Híbrido" (Feb 15, 2026)

## 1. Resumen Ejecutivo: Estado del Arte
El proyecto ha evolucionado de un MVP a una **Plataforma Híbrida Inteligente**. La arquitectura base es sólida, centrada en Next.js 14 y Supabase, con una capa de IA sofisticada que orquesta contenido y atención al usuario.
Recientemente superamos problemas críticos de **Build & Runtime** al migrar a una arquitectura de carga dinámica para los módulos de IA pesados.

### 🏆 Logros Clave (Funcionando)
1.  **Cerebro Híbrido (IA)**:
    *   **Arquitectura Dual**: Groq (Llama 3 70b) como cerebro rápido/principal y Gemini 1.5 Flash como fallback robusto.
    *   **LLM Router**: Sistema centralizado (`lib/llm-router`) que gestiona proveedores y fallos transparentemente.
    *   **Optimización**: Implementación de `lazy loading` para LangChain, evitando crashes en el cliente (navegador).
2.  **Telegram Bot V3 (Agente Autónomo)**:
    *   Integrado vía Webhook.
    *   Capaz de responder consultas naturales usando el contexto del sitio.
    *   Conectado al "Cerebro Híbrido".
3.  **Highway Algorithm (Algoritmo de Recomendación)**:
    *   Implementación de "Intención del Usuario" (User Intent Score) para transicionar entre contenido Jobs -> Party -> Adult.
    *   A/B Testing framework (`lib/abTestConfig.ts`) funcional para experimentar con recompensas (likes).
4.  **Sistema de Contenido (Feed Adaptativo)**:
    *   Hook `useAdaptiveFeed` que mezcla contenido orgánico, scrapeado y anuncios de afiliados de forma inteligente.
    *   Soporte para múltiples tipos de media (Video, Iframe, Imagen).

## 2. Diagnóstico de Subsistemas

### A. Frontend & UX (Cliente)
*   **Estado**: Estabilizado tras el arreglos de imports dinámicos.
*   **Riesgo**: El bundle size sigue siendo alto debido a dependencias de IA y visualización.
*   **Oportunidad**: La UI estilo "Casino/Neon" está implementada pero requiere pulido en animaciones y transiciones para sentirse "Premium AAA".

### B. Backend & API (Servidor/Edge)
*   **Estado**: Funcional. Endpoints críticos (`/api/telegram/webhook`, `/api/cron/run-sce`) operativos.
*   **Alerta 🚨**: Detectamos un error en logs recientes: `Could not find the table 'public.geo_alerts'`. Esto indica que la funcionalidad de GeoAlerts está intentando ejecutarse sin su respaldo en base de datos.
*   **Seguridad**: Las claves de API están protegidas en variables de entorno, pero se requiere rotación periódica preventiva.

### C. Data & Scraping (SCEs)
*   **Estado**: Los "Sistemas de Captura de Eventos" (SCE) están definidos (`sce-nightlife`, `sce-adult`, etc.).
*   **Pendiente**: Validación de ejecución en producción. Sabemos que corren, pero necesitamos métricas de "calidad de dato" (cuántos eventos reales vs basura se están guardando).

## 3. Plan de Trabajo Estratégico (Input para Claude)

### Fase 1: Estabilización y Limpieza (Inmediato)
1.  **Fix GeoAlerts**: Crear la tabla `geo_alerts` faltante o corregir la referencia en el código.
2.  **Database Audit**: Verificar integridad de tablas `content`, `user_intents` y `affiliate_links`.
3.  **Log Monitoring**: Implementar un dashboard simple en Telegram que reporte errores críticos del sistema en tiempo real (no solo al usuario, sino al admin).

### Fase 2: Optimización de "Cerebro" (Corto Plazo)
1.  **Fine-tuning del Router**: Ajustar los timeouts de Groq/Gemini para minimizar latencia en respuestas de Telegram.
2.  **Expansión de Tools**: Darle al Agente Híbrido capacidad de *escribir* en la base de datos (ej. "Agéndame este evento"), no solo leer.

### Fase 3: Growth & Monetization (Mediano Plazo)
1.  **Activar Highway**: Encender los experimentos A/B al 100% de tráfico y recolectar data de conversión.
2.  **Affiliate Intelligence**: Que el agente *sugiera* links de afiliados contextualmente en el chat de Telegram ("Si vas a Vallarta, checa este hotel...").

---
**Conclusión para Claude:**
El sistema es funcional y potente. El mayor riesgo actual es la deuda técnica en la base de datos (tablas faltantes) y la necesidad de monitoreo proactivo. La infraestructura de IA está lista para escalar.
