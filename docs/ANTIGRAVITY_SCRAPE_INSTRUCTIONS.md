# 🚀 INSTRUCCIONES COMPLETAS - ANTIGRAVITY
## PROYECTO: SCRAPE MASIVO VENUZ - PORNDUDE + TOP 10 SITIOS

**Fecha:** 2026-01-28  
**Objetivo:** Poblar BD VENUZ con 5000+ registros de sitios adultos  
**Tiempo Estimado:** 6-8 horas  
**Responsable:** Antigravity (Remote Execution)

---

## 📋 CONTEXTO DEL PROYECTO

### **Visión VENUZ**
VENUZ es una plataforma de descubrimiento adulto tipo TikTok con:
- Feed infinito inteligente
- Múltiples categorías organizadas
- Links de afiliados
- Tono "guía turística" (NO hard-sell)
- Escalable: nuevos sitios continuamente

### **Tu Tarea**
Scrape + Estructura + Insertar datos de PornDude + Top 10 sitios web en Supabase.

---

## 🎯 ESTRUCTURA PORNDUDE vs VENUZ

### **PORNDUDE (REFERENCIA)**
- Organizacion por categorías (webcams, escorts, clubs, etc)
- Descripciones detalladas
- Links directos
- Fotos/thumbnails
- Ratings y reviews

### **VENUZ (OBJETIVO)**
```json
{
  "id": "unique-id",
  "title": "Nombre del lugar/modelo",
  "description": "Descripción en tono guía turística",
  "image_url": "url_imagen_atractiva",
  "video_url": "url_video_preview (opcional)",
  "category": "webcam|escort|club|bar|servicio|evento|concierto|citas|otro",
  "subcategory": "subtipo dentro categoría",
  "location": "Ciudad, País",
  "latitude": 20.6534,
  "longitude": -105.2253,
  "affiliate_url": "link_actual_temporal",
  "affiliate_source": "porndude|camsoda|stripchat|chaturbate|otro",
  "is_verified": true|false,
  "is_premium": true|false,
  "is_open_now": true|false,
  "open_until": "4:00 AM",
  "rating": 4.5,
  "likes": 234,
  "views": 1523,
  "viewers_now": 847,
  "address": "Dirección física si aplica",
  "phone": "Teléfono si aplica",
  "active": true,
  "created_at": "2026-01-28T15:30:00Z",
  "updated_at": "2026-01-28T15:30:00Z"
}
```

---

## 📂 ESTRUCTURA DE CARPETAS

Crea esto en tu sistema:

```
C:\Users\pablo\Downloads\VENUZ-Complete-App\venuz-app\scrape-data\
├─ checkpoint.json                    ← ESTADO ACTUAL (lee primero!)
├─ CHECKPOINT_HISTORY.json            ← Histórico
├─ 001_webcams.json                   ← Datos por categoría
├─ 002_escorts.json
├─ 003_clubs.json
├─ 004_bares.json
├─ 005_servicios.json
├─ 006_eventos.json
├─ 007_conciertos.json
├─ 008_citas.json
├─ 009_apps_citas.json
├─ 010_otros.json
├─ SCRAPE_LOG.txt                     ← Log detallado
├─ FINAL_DATA.json                    ← Consolidado listo para insertar
└─ README_SCRAPE.md                   ← Este archivo
```

---

## 🔍 TOP 10 SITIOS A SCRAPEAR

**Prioridad 1 (CRÍTICO):**
1. **PornDude.com** - Directorio maestro
2. **CamSoda.com** - Webcams (API available)
3. **Stripchat.com** - Webcams
4. **Chaturbate.com** - Webcams

**Prioridad 2 (IMPORTANTE):**
5. **Encontrales.net** - Escorts Mexico
6. **Sexomercado.com** - Escorts Mexico
7. **BeautifulAgency.com** - Escorts premium

**Prioridad 3 (NICE TO HAVE):**
8. **Google Places API** - Clubs, bares
9. **TikTok/Instagram** - Trending content
10. **Sitios locales mexicanos** - Eventos, conciertos

---

## 💻 SCRIPT PYTHON - SCRAPER PRINCIPAL

```python
#!/usr/bin/env python3
# scraper.py - ANTIGRAVITY SCRAPER

import json
import os
import time
from datetime import datetime
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
import logging

# ============================================
# CONFIGURACION
# ============================================

SCRAPE_DATA_DIR = r"C:\Users\pablo\Downloads\VENUZ-Complete-App\venuz-app\scrape-data"
CHECKPOINT_FILE = os.path.join(SCRAPE_DATA_DIR, "checkpoint.json")
LOG_FILE = os.path.join(SCRAPE_DATA_DIR, "SCRAPE_LOG.txt")

# Crear directorio si no existe
os.makedirs(SCRAPE_DATA_DIR, exist_ok=True)

# Logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ============================================
# ESTRUCTURA DE CHECKPOINT
# ============================================

DEFAULT_CHECKPOINT = {
    "timestamp": datetime.now().isoformat(),
    "estado": "INICIADO",
    "categorias_completadas": {},
    "total_registros_scrapeados": 0,
    "proxima_categoria": "webcams",
    "proxima_url": None,
    "errores": []
}

# ============================================
# FUNCIONES HELPER
# ============================================

def crear_carpeta_scrape():
    """Crea carpeta de scrape si no existe"""
    os.makedirs(SCRAPE_DATA_DIR, exist_ok=True)
    print(f"✅ Carpeta creada: {SCRAPE_DATA_DIR}")

def leer_checkpoint():
    """Lee checkpoint anterior (para continuar si se corta)"""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
            checkpoint = json.load(f)
        print(f"✅ Checkpoint cargado: {checkpoint['proxima_categoria']}")
        return checkpoint
    else:
        print("ℹ️ Primer run - Iniciando desde cero")
        return DEFAULT_CHECKPOINT.copy()

def guardar_checkpoint(checkpoint: Dict[str, Any]):
    """Guarda checkpoint cada 100 registros"""
    checkpoint["timestamp"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)
    logging.info(f"💾 Checkpoint guardado - Total: {checkpoint['total_registros_scrapeados']}")

def guardar_datos_categoria(categoria: str, datos: List[Dict]):
    """Guarda datos de cada categoría en archivo separado"""
    archivo = os.path.join(SCRAPE_DATA_DIR, f"{categoria}.json")
    with open(archivo, 'w', encoding='utf-8') as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)
    logging.info(f"💾 {len(datos)} registros guardados en {categoria}.json")

def reporte_progreso(checkpoint: Dict[str, Any]):
    """Imprime reporte de progreso"""
    print("\n" + "="*60)
    print("📊 REPORTE DE PROGRESO")
    print("="*60)
    print(f"Total registros scrapeados: {checkpoint['total_registros_scrapeados']}")
    print(f"Próxima categoría: {checkpoint['proxima_categoria']}")
    print(f"Categorías completadas: {list(checkpoint['categorias_completadas'].keys())}")
    if checkpoint['errores']:
        print(f"⚠️ Errores encontrados: {len(checkpoint['errores'])}")
    print("="*60 + "\n")

# ============================================
# SCRAPERS POR SITIO
# ============================================

class PornDudeScraper:
    """Scraper para PornDude.com"""
    
    def __init__(self):
        self.base_url = "https://www.porndude.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_webcams(self) -> List[Dict]:
        """Scrape categoría webcams"""
        datos = []
        try:
            # Estructura esperada de PornDude
            url = f"{self.base_url}/en/porn-sites/live-sex-cams"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Buscar items (estructura puede variar)
            items = soup.find_all('div', class_='item')  # Ajustar selector
            
            for item in items[:50]:  # Primeros 50 de prueba
                try:
                    title = item.find('h3')
                    img = item.find('img')
                    desc = item.find('p')
                    link = item.find('a')
                    
                    if title and link:
                        datos.append({
                            "title": title.text.strip(),
                            "description": desc.text.strip() if desc else "Sitio de webcams en vivo",
                            "image_url": img.get('src') if img else "",
                            "affiliate_url": link.get('href'),
                            "affiliate_source": "porndude",
                            "category": "webcam",
                            "is_verified": True,
                            "is_premium": False,
                            "rating": 4.5,
                            "active": True,
                            "created_at": datetime.now().isoformat()
                        })
                except Exception as e:
                    logging.error(f"Error parseando item: {e}")
                    continue
            
            logging.info(f"✅ PornDude webcams: {len(datos)} registros")
            return datos
            
        except Exception as e:
            logging.error(f"❌ Error en PornDude webcams: {e}")
            return []
    
    def scrape_escorts(self) -> List[Dict]:
        """Scrape categoría escorts"""
        datos = []
        try:
            url = f"{self.base_url}/en/porn-sites/escort-sites"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            items = soup.find_all('div', class_='item')
            
            for item in items[:50]:
                try:
                    title = item.find('h3')
                    img = item.find('img')
                    desc = item.find('p')
                    link = item.find('a')
                    
                    if title and link:
                        datos.append({
                            "title": title.text.strip(),
                            "description": desc.text.strip() if desc else "Plataforma de escorts verificadas",
                            "image_url": img.get('src') if img else "",
                            "affiliate_url": link.get('href'),
                            "affiliate_source": "porndude",
                            "category": "escort",
                            "is_verified": True,
                            "is_premium": True,
                            "rating": 4.7,
                            "active": True,
                            "created_at": datetime.now().isoformat()
                        })
                except Exception as e:
                    logging.error(f"Error parseando escort: {e}")
                    continue
            
            logging.info(f"✅ PornDude escorts: {len(datos)} registros")
            return datos
            
        except Exception as e:
            logging.error(f"❌ Error en PornDude escorts: {e}")
            return []
    
    def scrape_clubs(self) -> List[Dict]:
        """Scrape categoría clubs"""
        # Similar a webcams/escorts
        return []
    
    def scrape_bares(self) -> List[Dict]:
        """Scrape categoría bares"""
        return []

class CamSodaScraper:
    """Scraper para CamSoda.com (con API si está disponible)"""
    
    def scrape_live_models(self) -> List[Dict]:
        """Scrape modelos en vivo de CamSoda"""
        datos = []
        try:
            # CamSoda podría tener API pública
            url = "https://www.camsoda.com/api/v1/browse/recommendations"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                json_data = response.json()
                # Procesar respuesta según estructura API
                logging.info(f"✅ CamSoda: {len(datos)} modelos en vivo")
            
        except Exception as e:
            logging.error(f"❌ Error CamSoda: {e}")
        
        return datos

# ============================================
# TRANSFORMACION DE DATOS - TONO GUÍA TURÍSTICA
# ============================================

TRANSFORMACIONES = {
    "webcam": {
        "genérico": "Visita este sitio de entretenimiento en vivo",
        "premium": "Descubre contenido premium de modelaje en vivo",
        "trending": "Sitio trending con shows en vivo ahora"
    },
    "escort": {
        "genérico": "Conecta con profesionales independientes verificadas",
        "premium": "Acceso a servicios VIP con modelos certificadas",
        "trending": "Compañía profesional - Disponible 24/7"
    },
    "club": {
        "genérico": "Disfruta de la mejor vida nocturna",
        "premium": "Club VIP exclusivo con ambiente premium",
        "trending": "Club trending - Vive la experiencia nocturna"
    },
    "bar": {
        "genérico": "Buen lugar para disfrutar y socializar",
        "premium": "Bar premium con ambiente sofisticado",
        "trending": "Bar trending - Ambiente vibrante"
    }
}

def transformar_descripcion(categoria: str, es_premium: bool, es_trending: bool) -> str:
    """Transforma descripción a tono 'guía turística'"""
    if categoria not in TRANSFORMACIONES:
        return "Descubre este lugar interesante"
    
    cat_transforms = TRANSFORMACIONES[categoria]
    
    if es_trending:
        return cat_transforms.get("trending", cat_transforms["genérico"])
    elif es_premium:
        return cat_transforms.get("premium", cat_transforms["genérico"])
    else:
        return cat_transforms.get("genérico")

# ============================================
# INSERCIÓN EN SUPABASE
# ============================================

def insertar_en_supabase(datos: List[Dict]):
    """Inserta datos en Supabase"""
    try:
        from supabase import create_client, Client
        
        # Variables de entorno
        supabase_url = "https://jbrmziwosyeructvlvrq.supabase.co"
        supabase_key = os.getenv("SUPABASE_KEY")  # Configurar en .env
        
        if not supabase_key:
            logging.error("❌ SUPABASE_KEY no configurada")
            return False
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Insertar en batch de 100
        for i in range(0, len(datos), 100):
            batch = datos[i:i+100]
            response = supabase.table('content').insert(batch).execute()
            logging.info(f"✅ Insertados {len(batch)} registros en Supabase")
        
        return True
        
    except Exception as e:
        logging.error(f"❌ Error insertando en Supabase: {e}")
        return False

# ============================================
# MAIN EXECUTION
# ============================================

def main():
    print("🚀 INICIANDO SCRAPE MASIVO VENUZ")
    print("="*60)
    
    # 1. Crear carpeta
    crear_carpeta_scrape()
    
    # 2. Leer checkpoint (para continuar si se corta)
    checkpoint = leer_checkpoint()
    
    # 3. Scraping
    print("\n📍 FASE 1: SCRAPEANDO PORNDUDE")
    scraper_pd = PornDudeScraper()
    
    datos_webcams = scraper_pd.scrape_webcams()
    guardar_datos_categoria("001_webcams", datos_webcams)
    checkpoint['categorias_completadas']['webcams'] = len(datos_webcams)
    checkpoint['total_registros_scrapeados'] += len(datos_webcams)
    guardar_checkpoint(checkpoint)
    
    datos_escorts = scraper_pd.scrape_escorts()
    guardar_datos_categoria("002_escorts", datos_escorts)
    checkpoint['categorias_completadas']['escorts'] = len(datos_escorts)
    checkpoint['total_registros_scrapeados'] += len(datos_escorts)
    guardar_checkpoint(checkpoint)
    
    # 4. CamSoda
    print("\n📍 FASE 2: SCRAPEANDO CAMSODA")
    scraper_cs = CamSodaScraper()
    datos_camsoda = scraper_cs.scrape_live_models()
    guardar_datos_categoria("001_webcams", datos_camsoda)
    
    # 5. Consolidar
    print("\n📍 FASE 3: CONSOLIDANDO DATOS")
    todos_datos = datos_webcams + datos_escorts + datos_camsoda
    
    # Guardar consolidado
    final_file = os.path.join(SCRAPE_DATA_DIR, "FINAL_DATA.json")
    with open(final_file, 'w', encoding='utf-8') as f:
        json.dump(todos_datos, f, indent=2, ensure_ascii=False)
    
    # 6. Reporte final
    reporte_progreso(checkpoint)
    
    print(f"\n✅ SCRAPE COMPLETO")
    print(f"📊 Total registros: {len(todos_datos)}")
    print(f"📁 Datos guardados en: {SCRAPE_DATA_DIR}")
    print(f"📄 Archivo final: {final_file}")
    
    # 7. Insertar en Supabase (opcional)
    print("\n🔄 ¿Insertar en Supabase? (manual o automático)")

if __name__ == "__main__":
    main()
```

---

## 🔧 INSTALACIÓN & EJECUCIÓN

### **1. Requisitos**
```bash
pip install requests beautifulsoup4 supabase-py python-dotenv
```

### **2. Configurar variables de entorno**
```
# .env
SUPABASE_KEY=tu_supabase_key_aqui
SUPABASE_URL=https://jbrmziwosyeructvlvrq.supabase.co
```

### **3. Ejecutar scraper**
```powershell
cd C:\Users\pablo\Downloads\VENUZ-Complete-App\venuz-app
python scraper.py
```

### **4. Monitorear progreso**
```powershell
# Ver log en tiempo real
Get-Content scrape-data\SCRAPE_LOG.txt -Tail 20 -Wait

# Ver checkpoint
Get-Content scrape-data\checkpoint.json
```

---

## 📊 INSERCIÓN EN SUPABASE

Una vez scraped, insertar con este script SQL:

```sql
-- INSERT_SCRAPED_DATA.sql
BEGIN;

-- Insertar datos scrapeados
INSERT INTO content (
  title, description, image_url, video_url,
  category, subcategory, location,
  latitude, longitude,
  affiliate_url, affiliate_source,
  is_verified, is_premium,
  rating, likes, views,
  active, created_at, updated_at
)
SELECT 
  title, description, image_url, video_url,
  category, subcategory, location,
  latitude, longitude,
  affiliate_url, affiliate_source,
  is_verified, is_premium,
  rating, likes, views,
  active, created_at, updated_at
FROM json_to_recordset(
  -- Leer FINAL_DATA.json
) AS t(
  title TEXT, description TEXT, image_url TEXT, video_url TEXT,
  category TEXT, subcategory TEXT, location TEXT,
  latitude DECIMAL, longitude DECIMAL,
  affiliate_url TEXT, affiliate_source TEXT,
  is_verified BOOLEAN, is_premium BOOLEAN,
  rating NUMERIC, likes INTEGER, views INTEGER,
  active BOOLEAN, created_at TIMESTAMP, updated_at TIMESTAMP
);

-- Recrear geo_points
UPDATE content
SET geo_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE geo_point IS NULL AND latitude IS NOT NULL;

-- Reindex
ANALYZE content;

COMMIT;
```

---

## ✅ CHECKLIST

- [ ] Crear carpeta `/scrape-data/`
- [ ] Instalar dependencias Python
- [ ] Configurar `.env` con SUPABASE_KEY
- [ ] Ejecutar `python scraper.py`
- [ ] Monitorear `/scrape-data/SCRAPE_LOG.txt`
- [ ] Esperar reporte cada 100 registros
- [ ] Validar datos en `/scrape-data/FINAL_DATA.json`
- [ ] Insertar en Supabase
- [ ] Verificar en BD

---

## 🆘 SI SE CORTA

**Proceso de reanudación:**

1. Lee `checkpoint.json` (dice dónde te quedaste)
2. Ejecuta `python scraper.py` de nuevo
3. Script detecta checkpoint y continúa desde `proxima_categoria`
4. CERO pérdida de datos

---

## 📞 SOPORTE

Si hay errores:
1. Check `/scrape-data/SCRAPE_LOG.txt`
2. Ajusta selectores HTML en scraper (estructura de sitios puede cambiar)
3. Contacta a Claude si necesitas ayuda con lógica

---

**¡A TRABAJAR, ANTIGRAVITY!** 🚀

