# 🛣️ VENUZ HIGHWAY ALGORITHM - Documentación Técnica

## Versión: 2.0 (con mejoras de Grok)
## Fecha de Implementación: 2026-01-30
## Colaboradores: Antigravity + Grok + Claude

---

## 📊 Resumen Ejecutivo

El **Highway Algorithm** es el sistema de recomendación "Nivel Dios" de VENUZ. Funciona como una "supercarretera" de contenido donde los usuarios transitan gradualmente entre 3 pilares:

| Pilar | Descripción | Objetivo |
|-------|-------------|----------|
| **Pilar 1: Adult** | Webcams, sitios adultos, smartlinks | Monetización directa |
| **Pilar 2: PartyFinder** | Eventos, bares, antros, ofertas | Engagement/Retención |
| **Pilar 3: Jobs/Agencia** | Empleos, edecanes, modelos | Adquisición de usuarios |

---

## 🆕 Mejoras v2.0 (Sugerencias de Grok)

### 1. Detección de Referrer Avanzada
- **Dual tracking**: `first_referrer` + `last_referrer`
- **Normalización agresiva**: Facebook/fb/fbclid → "facebook"
- **Performance API fallback**: `navigation.type` para reload/back_forward
- **Parámetros especiales**: gclid, fbclid, msclkid, ttclid

### 2. Tiered Decay System
| Inactividad | Decay Rate | Descripción |
|-------------|------------|-------------|
| 0-5 min | 0.995 | Casi sin decay |
| 5-15 min | 0.97 | Decay medio |
| 15-30 min | 0.90 | Decay fuerte |
| 30+ min | 0.50 | Decay muy fuerte |

### 3. Decay Multipliers por Canal
| Canal | Multiplier | Efecto |
|-------|------------|--------|
| retargeting | 0.7 | Decae más lento |
| email | 0.6 | Muy persistente |
| paid_search | 1.0 | Normal |
| organic | 1.2 | Decae más rápido |

### 4. Visibility Change Handler
- Pausa decay cuando tab está oculto
- Aplica decay al volver según tiempo inactivo
- Partial reset (70%) al reactivarse

---

## 🧠 Fórmula Cuadrática de Pesos

El algoritmo usa un `intent_score` de 0 a 1 para calcular qué porcentaje de cada pilar mostrar:

```
w_job   = (1 - intent_score)²
w_event = 2 × intent_score × (1 - intent_score)  
w_adult = intent_score²
```

### Ejemplo de Transición:

| Intent Score | Job % | Event % | Adult % | Estado del Usuario |
|--------------|-------|---------|---------|-------------------|
| 0.0 | 100% | 0% | 0% | Cold (buscando trabajo) |
| 0.3 | 49% | 42% | 9% | Explorando |
| 0.5 | 25% | 50% | 25% | Enganchado |
| 0.7 | 9% | 42% | 49% | Caliente |
| 1.0 | 0% | 0% | 100% | Ready for Adult |

---

## 🔄 The Transition Wheel

El `intent_score` se actualiza dinámicamente con cada interacción:

### Deltas por Acción:

| Acción | Delta | Justificación |
|--------|-------|---------------|
| View (cualquier) | +0.01 | Interés pasivo |
| Like Job | +0.05 | Interés en empleo (mantiene cold) |
| Like Event | +0.15 | **Acelerador clave** → lleva hacia adult |
| Like Adult | +0.03 | Ya está caliente, refuerzo menor |

### 🎯 The Third Like Rule

Cuando un usuario da **3 likes a eventos**, se aplica un bonus de **+0.30** al intent_score. Esto inyecta contenido adult de forma significativa.

---

## 🧪 A/B Testing System (v2.0)

Sistema configurable para optimizar los deltas según variantes de Grok:

### Variantes Implementadas:

| Variante | LIKE_EVENT | THIRD_BONUS | 3 Likes = Score | Hipótesis |
|----------|------------|-------------|-----------------|-----------|
| **Control** | 0.15 | 0.30 | 0.75 | Baseline estable |
| **A: Reward Bursts** | 0.12 | 0.45 | 0.81 (+8%) | Incentiva 3+ likes |
| **B: Smooth** | 0.18 | 0.20 | 0.74 | Mejor en 4+ likes |
| **C: Aggressive** | 0.20 | 0.35 | 0.95 (+27%) | Captura temprana |

### Uso:

```tsx
import { assignVariant, getDynamicDeltas, forceVariant } from '@/lib/abTestConfig';

// Asignar variante automáticamente (25% cada una)
const variant = assignVariant(userId);

// Obtener deltas para esta variante
const deltas = getDynamicDeltas(userId);

// Forzar variante para testing
forceVariant('C');
```

### Métricas a Trackear:
- Tasa de conversión por variante
- Promedio de intent_score al convertir
- % de sesiones con 3+ likes
- Bounce rate por variante

## 📍 Inicialización por Referrer

El intent inicial depende de dónde viene el tráfico:

| Origen del Tráfico | Intent Inicial | Carril |
|-------------------|----------------|--------|
| FB/LinkedIn (empleo) | 0.0 | Job-first |
| Evento/Party | 0.4 | Event-first |
| Adult sites | 0.8 | Adult-first |
| Google (organic) | 0.3 | Exploración |
| Directo | 0.5 | Neutral |

---

## 🗄️ Estructura de Datos

### Tabla: `user_intents`

```sql
CREATE TABLE user_intents (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    intent_score NUMERIC(4,3),  -- 0.000 a 1.000
    initial_referrer VARCHAR(50),
    likes_job INTEGER,
    likes_event INTEGER,
    likes_adult INTEGER,
    total_views INTEGER,
    lat DECIMAL, lng DECIMAL,
    utm_source, utm_medium, utm_campaign,
    created_at, updated_at, last_activity_at
);
```

### Extensión de `content`:

```sql
ALTER TABLE content ADD COLUMN pillar VARCHAR(20);  -- 'job', 'event', 'adult'
ALTER TABLE content ADD COLUMN geo_slug VARCHAR(150);  -- SEO subdominios
ALTER TABLE content ADD COLUMN city VARCHAR(100);
ALTER TABLE content ADD COLUMN state VARCHAR(100);
ALTER TABLE content ADD COLUMN extra_data JSONB;
ALTER TABLE content ADD COLUMN smartlink_url TEXT;
```

---

## 🔌 API Endpoints

### GET `/api/highway`

Obtiene el feed personalizado.

```
GET /api/highway?userId=xxx&limit=20&offset=0&lat=20.65&lng=-103.35

Response:
{
  feed: [...items],
  meta: { total, offset, limit, hasMore },
  intent: { score: 0.45, referrer: 'evento', likes: {...} },
  weights: { job: 30, event: 48, adult: 22 }
}
```

### POST `/api/highway`

Actualiza el intent del usuario.

```json
// Inicializar
{ "action": "initialize", "userId": "xxx", "referrer": "empleo" }

// Registrar like
{ "action": "like", "userId": "xxx", "pillar": "event", "contentId": "uuid" }

// Registrar view
{ "action": "view", "userId": "xxx", "pillar": "adult", "contentId": "uuid" }
```

---

## 🎣 Hooks React

### `useUserIntent()`

```tsx
const { 
  intentScore,      // 0-1
  weights,          // { wJob, wEvent, wAdult }
  recordLike,       // (contentId, pillar) => void
  recordView,       // (contentId, pillar) => void
} = useUserIntent();
```

### `useHighwayFeed()`

```tsx
// TODO: Combinar useContent con Highway
const { feed, isLoading, loadMore } = useHighwayFeed();
```

---

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `lib/highwayAlgorithm.ts` | Core del algoritmo (fórmula cuadrática, pilares) |
| `lib/sessionUtils.ts` | 🆕 Sistema de sesión, referrer, decay (v2.0 Grok) |
| `hooks/useUserIntent.ts` | Hook React v2.0 con visibility handler |
| `app/api/highway/route.ts` | API endpoints (GET/POST) |
| `supabase/migrations/20260130_highway_user_intents.sql` | Schema DB |
| `docs/HIGHWAY_ALGORITHM.md` | Esta documentación |

---

## 🚀 Rollout Gradual (Feature Flags)

### Configuración actual:

```typescript
const ROLLOUT_CONFIG = {
    highway_algorithm: { percentage: 100 },    // Empezar con 10%, subir gradualmente
    highway_ab_testing: { percentage: 100 },  // A/B testing al 100%
    highway_tracking: { percentage: 100 },    // Tracking siempre activo
};
```

### Fases de Rollout Recomendadas:

| Fase | Porcentaje | Duración | Qué monitorear |
|------|------------|----------|----------------|
| 1️⃣ Alpha | 5% | 2-3 días | Errores, performance |
| 2️⃣ Beta | 25% | 1 semana | Métricas A/B |
| 3️⃣ Expansion | 50% | 1 semana | Conversión, bounce |
| 4️⃣ GA | 100% | - | Todo estable |

---

## ✅ Tareas Completadas

- [x] Fórmula cuadrática de pesos (Grok)
- [x] Tiered decay por inactividad (Grok v2.0)
- [x] Dual referrer tracking
- [x] A/B Testing con 4 variantes
- [x] Nuevos eventos de analytics
- [x] Feature Flags para rollout
- [x] Hook useHighwayFeed
- [x] API /api/highway funcionando

## 🔜 Próximos Pasos

1. **Aplicar migración SQL** (`supabase/run_pillar_migration.sql`)
2. **Integrar useHighwayFeed** en página principal
3. **Conectar ContentCard** con tracking de pilares
4. **Monitorear métricas** por variante A/B

---

## 🏆 Métricas de Éxito

| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| Conversión a Adult | >15% de usuarios | intent_score > 0.6 |
| Engagement Events | 3+ likes promedio | likes_event count |
| Time to Conversion | <10 interacciones | tracking de sesión |
| ARPU | TBD | Smartlink clicks / users |
| Response Time API | <50ms | highway_api_call |

---

*Documento actualizado por Antigravity + Grok - 2026-01-30*

