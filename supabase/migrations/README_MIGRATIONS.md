# 🔧 VENUZ Database Migration Guide

## Fecha: 2026-01-27
## Versión: 1.0

---

## 📋 RESUMEN DE MIGRACIONES

| # | Archivo | Descripción | Criticidad |
|---|---------|-------------|------------|
| 1 | `20260127_001_add_missing_fields.sql` | Agrega campos faltantes a `content` | 🔴 CRÍTICA |
| 2 | `20260127_002_add_geo_indexes.sql` | PostGIS + índices geoespaciales | 🟠 ALTA |
| 3 | `20260127_003_update_rls_policies.sql` | Políticas de seguridad RLS | 🟠 ALTA |
| 4 | `20260127_004_cleanup_orphan_tables.sql` | Limpieza de tablas huérfanas | 🟡 MEDIA |
| 5 | `20260127_005_populate_test_data.sql` | Datos de prueba (OPCIONAL) | 🟢 BAJA |

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Backup (OBLIGATORIO)
1. Ve a **Supabase Dashboard** → tu proyecto
2. **Settings** → **Database** → **Backups**
3. Crea un backup manual antes de proceder

### Paso 2: Ejecutar Migraciones
1. Ve a **SQL Editor** en Supabase Dashboard
2. Ejecuta cada archivo **EN ORDEN** (001, 002, 003, etc.)
3. Espera a que cada uno termine antes de ejecutar el siguiente

### Paso 3: Verificación
Después de cada migración, ejecuta la query de verificación al final del archivo.

---

## 📝 DETALLE POR MIGRACIÓN

### Migration 001: Add Missing Fields
**¿Qué hace?**
- Agrega `latitude`, `longitude` para geolocalización
- Agrega `location` como string cacheado
- Agrega `is_verified`, `is_premium` para badges
- Agrega `likes`, `rating` para engagement
- Agrega `updated_at` con trigger automático
- Agrega `category` como string (compatible con frontend)

**Campos nuevos en `content`:**
```sql
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
location VARCHAR(255)
is_verified BOOLEAN
is_premium BOOLEAN
is_open_now BOOLEAN
open_until VARCHAR(50)
likes INTEGER
address VARCHAR(500)
phone VARCHAR(50)
rating NUMERIC(3,2)
updated_at TIMESTAMP
category VARCHAR(100)
distance_km DECIMAL(6,2)
subcategory VARCHAR(100)
```

### Migration 002: Geo Indexes
**¿Qué hace?**
- Habilita extensión PostGIS
- Crea columna `geo_point` (geography type)
- Crea índice espacial para búsquedas rápidas
- Crea función `get_nearby_content()` para buscar por proximidad

**Uso:**
```sql
-- Obtener 20 lugares a máximo 25km de Guadalajara
SELECT * FROM get_nearby_content(20.6597, -103.3496, 25, 20);
```

### Migration 003: RLS Policies
**¿Qué hace?**
- Actualiza políticas de Row Level Security
- Lectura pública para contenido activo
- Acceso completo para service_role (scrapers)
- Rate limiting anti-spam (max 30 interacciones/minuto)

### Migration 004: Cleanup
**¿Qué hace?**
- Migra datos de `user_profiles` → `profiles`
- Crea tabla `favorites` si no existe
- Agrega constraints FK faltantes

**⚠️ IMPORTANTE:** Los `DROP TABLE` están comentados. Descomenta SOLO después de verificar que no se usan.

### Migration 005: Test Data (OPCIONAL)
**¿Qué hace?**
- Inserta categorías si no existen
- Inserta regiones de México
- Inserta ~8 items de contenido de ejemplo

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Ejecuta esta query para verificar que todo está bien:

```sql
-- 1. Verificar estructura de content
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content'
ORDER BY ordinal_position;

-- 2. Verificar que hay datos con nuevos campos
SELECT 
    COUNT(*) as total,
    COUNT(latitude) as with_coords,
    COUNT(category) as with_category,
    COUNT(is_verified) as with_verified
FROM content;

-- 3. Verificar RLS está activo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 4. Verificar PostGIS está activo
SELECT PostGIS_Version();

-- 5. Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'content';
```

---

## 🔥 SI ALGO SALE MAL

### Rollback Migration 001:
```sql
ALTER TABLE content DROP COLUMN IF EXISTS latitude;
ALTER TABLE content DROP COLUMN IF EXISTS longitude;
ALTER TABLE content DROP COLUMN IF EXISTS location;
-- ... (revertir cada ADD COLUMN)
```

### Restaurar Backup:
1. Supabase Dashboard → Settings → Database → Backups
2. Selecciona el backup previo a las migraciones
3. Click "Restore"

---

## 📞 SOPORTE

Si encuentras errores:
1. Copia el mensaje de error completo
2. Indica qué migración falló
3. Comparte con el equipo de desarrollo

---

**Creado por Antigravity para VENUZ v2.0**
