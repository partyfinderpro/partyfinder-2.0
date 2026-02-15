# 🚀 SCE Multi-Cerebro - Guía de Deployment

## ✅ PASO 1: Ejecutar SQL en Supabase

1. Ve a https://supabase.com/dashboard/project/jbrmziwosyeructvlvrq
2. SQL Editor → Nuevo query
3. Pega y ejecuta el schema completo (ya ejecutado ✅)
4. Pega y ejecuta el seed de URLs (ya ejecutado ✅)

## ✅ PASO 2: Copiar archivos al proyecto

Copia estos archivos a tu proyecto `venuz-con-bots`:

```
/lib/sce/brain-gobierno.ts
/lib/sce/alert-system.ts
/lib/sce/health-monitor.ts
/app/api/cron/sce-orchestrator/route.ts
```

## ✅ PASO 3: Variables de entorno

Agrega a `.env.local`:

```bash
# Ya existen
SUPABASE_URL=https://jbrmziwosyeructvlvrq.supabase.co
SUPABASE_SERVICE_KEY=tu_service_key

# Agregar estos nuevos
CRON_SECRET=genera_un_token_random_32_caracteres

# Telegram (opcional pero recomendado)
TELEGRAM_BOT_TOKEN=obtener_de_@BotFather
TELEGRAM_CHAT_ID=tu_chat_id
```

### Cómo obtener Telegram Bot:
1. Abre Telegram
2. Busca @BotFather
3. Envía `/newbot`
4. Sigue instrucciones
5. Guarda el token

## ✅ PASO 4: Configurar Vercel Cron

Crea/actualiza `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sce-orchestrator",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Explicación schedule:
- `0 */6 * * *` = Cada 6 horas
- Testing: `*/15 * * * *` = Cada 15 minutos

## ✅ PASO 5: Deploy

```bash
# Build local primero (CRÍTICO)
npm run build

# Si pasa sin errores
git add .
git commit -m "SCE Multi-Cerebro implementado"
git push origin main
```

## ✅ PASO 6: Testing

### Test 1: Endpoint manual
```bash
curl -X GET http://localhost:3000/api/cron/sce-orchestrator \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

### Test 2: Verificar en Supabase
```sql
-- Ver fuentes insertadas
SELECT count(*) FROM sce_sources;

-- Ver últimos health checks
SELECT * FROM sce_health_checks 
ORDER BY checked_at DESC LIMIT 10;

-- Ver alertas
SELECT * FROM sce_alerts 
ORDER BY created_at DESC LIMIT 10;
```

## ✅ PASO 7: Monitoreo

Dashboard en Supabase:
1. SQL Editor
2. Ejecuta queries de monitoreo

Ver logs en Vercel:
1. Dashboard Vercel
2. Functions → sce-orchestrator
3. Ver logs en tiempo real

## 🔧 Troubleshooting

**Error: "Table does not exist"**
→ Ejecuta el schema SQL completo

**Error: "CRON_SECRET undefined"**
→ Agrega variable en Vercel Dashboard → Settings → Environment Variables

**Cron no se ejecuta**
→ Verifica `vercel.json` esté en root del proyecto
→ Redeploy después de cambiar vercel.json

## 📊 Queries útiles

```sql
-- Fuentes con más fallos
SELECT name, url, fail_count 
FROM sce_sources 
WHERE fail_count > 0 
ORDER BY fail_count DESC;

-- Últimas 10 alertas críticas
SELECT * FROM sce_alerts 
WHERE severity = 'critical' 
ORDER BY created_at DESC 
LIMIT 10;

-- Health check promedio por fuente
SELECT 
  s.name,
  AVG(h.response_time_ms) as avg_response_ms,
  COUNT(*) as checks_count
FROM sce_health_checks h
JOIN sce_sources s ON s.id = h.source_id
GROUP BY s.name
ORDER BY avg_response_ms DESC;
```

## ✅ Checklist Final

- [ ] Schema SQL ejecutado
- [ ] Seed insertado (100 URLs)
- [ ] Archivos TypeScript copiados
- [ ] Variables de entorno configuradas
- [ ] vercel.json creado
- [ ] Build local exitoso
- [ ] Deploy a Vercel
- [ ] Test endpoint manual
- [ ] Verificar en Supabase
- [ ] Telegram configurado (opcional)

¡Listo! El SCE Multi-Cerebro está funcionando. 🎉
