---
description: Limpieza exhaustiva de todos los links de afiliados en la base de datos de VENUZ.
---

// turbo-all
1. Ejecutar el script por lotes de 500 hasta terminar.
```
npx tsx scripts/sanitizeLinks.ts
```

2. Repetir si quedan registros pendientes (el script procesa de 100 en 100 por defecto, lo voy a subir a 500).
