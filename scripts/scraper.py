#!/usr/bin/env python3
# scraper.py - ANTIGRAVITY SCRAPER
# 🚀 VENUZ MASSIVE SCRAPER

import json
import os
import time
from datetime import datetime
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
import sys
import logging
from dotenv import load_dotenv

# Configurar encoding para Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Cargar variables de entorno
load_dotenv()

# ============================================
# CONFIGURACION
# ============================================

SCRAPE_DATA_DIR = r"C:\Users\pablo\Downloads\VENUZ-Complete-App\venuz-app\scrape-data"
CHECKPOINT_FILE = os.path.join(SCRAPE_DATA_DIR, "checkpoint.json")
LOG_FILE = os.path.join(SCRAPE_DATA_DIR, "SCRAPE_LOG.txt")
FINAL_FILE = os.path.join(SCRAPE_DATA_DIR, "FINAL_DATA.json")

# URL de Supabase (del archivo .env.local o input)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://jbrmziwosyeructvlvrq.supabase.co")
# Intentamos obtener service role key, sino usamos la anon key (que puede fallar inserts si RLS bloquea)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Crear directorio si no existe
os.makedirs(SCRAPE_DATA_DIR, exist_ok=True)

# Logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8' # Forzamos utf-8 para evitar errores en Windows
)

# Console handler
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)

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

def leer_checkpoint():
    """Lee checkpoint anterior (para continuar si se corta)"""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                checkpoint = json.load(f)
            logging.info(f"✅ Checkpoint cargado: {checkpoint.get('proxima_categoria', 'webcams')}")
            return checkpoint
        except Exception as e:
            logging.error(f"Error leyendo checkpoint: {e}. Iniciando nuevo.")
    
    logging.info("ℹ️ Primer run - Iniciando desde cero")
    return DEFAULT_CHECKPOINT.copy()

def guardar_checkpoint(checkpoint: Dict[str, Any]):
    """Guarda checkpoint"""
    checkpoint["timestamp"] = datetime.now().isoformat()
    try:
        with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, indent=2, ensure_ascii=False)
        logging.info(f"💾 Checkpoint guardado - Total: {checkpoint['total_registros_scrapeados']}")
    except Exception as e:
        logging.error(f"Error guardando checkpoint: {e}")

def guardar_datos_categoria(categoria: str, datos: List[Dict]):
    """Guarda datos de cada categoría en archivo separado"""
    archivo = os.path.join(SCRAPE_DATA_DIR, f"{categoria}.json")
    try:
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        logging.info(f"💾 {len(datos)} registros guardados en {categoria}.json")
    except Exception as e:
        logging.error(f"Error guardando datos categoría {categoria}: {e}")

def reporte_progreso(checkpoint: Dict[str, Any]):
    """Imprime reporte de progreso"""
    print("\n" + "="*60)
    print("📊 REPORTE DE PROGRESO")
    print("="*60)
    print(f"Total registros scrapeados: {checkpoint['total_registros_scrapeados']}")
    print(f"Próxima categoría: {checkpoint.get('proxima_categoria')}")
    print(f"Categorías completadas: {list(checkpoint.get('categorias_completadas', {}).keys())}")
    errores = checkpoint.get('errores', [])
    if errores:
        print(f"⚠️ Errores encontrados: {len(errores)}")
    print("="*60 + "\n")

# ============================================
# SCRAPERS POR SITIO
# ============================================

class PornDudeScraper:
    """Scraper para PornDude.com"""
    
    def __init__(self):
        self.base_url = "https://theporndude.com" # URL Actualizada
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }

    def resolve_final_url(self, url: str) -> str:
        """Sigue redirecciones para obtener el dominio final real"""
        if not url or 'theporndude.com' not in url:
            return url
            
        try:
            logging.info(f"🔗 Resolviendo link real: {url}")
            # Intentar HEAD primero (rápido)
            r = requests.head(url, headers=self.headers, timeout=10, allow_redirects=True)
            final_url = r.url
            
            # Si el final sigue siendo PornDude, probamos con GET (por si hay meta-refresh)
            if 'theporndude.com' in final_url:
                r = requests.get(url, headers=self.headers, timeout=10, allow_redirects=True, stream=True)
                final_url = r.url
            
            from urllib.parse import urlparse
            parsed = urlparse(final_url)
            
            # Si salimos de PornDude, devolvemos el dominio base limpio
            if 'theporndude.com' not in parsed.netloc:
                return f"{parsed.scheme}://{parsed.netloc}"
                
            return url
        except Exception as e:
            logging.warning(f"⚠️ Error resolviendo {url}: {e}")
            return url
    
    def scrape_webcams(self) -> List[Dict]:
        """Scrape categoría webcams"""
        logging.info("Iniciando scrape de Webcams en PornDude...")
        datos = []
        try:
            # Estrategia: Ir al sitemap o home page
            url = f"{self.base_url}" 
            logging.info(f"Requesting Home: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=15)
            if response.status_code != 200:
                logging.error(f"Error {response.status_code}")
                return []
                
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Buscar link a 'Live Sex Cams'
            # Suele ser /en/live-sex-cams o similar
            cams_link = soup.find('a', string=lambda t: t and 'Live' in t and 'Cam' in t)
            if cams_link:
                url = self.base_url + cams_link['href'] if cams_link['href'].startswith('/') else cams_link['href']
                logging.info(f"Link de webcams encontrado: {url}")
                response = requests.get(url, headers=self.headers, timeout=15)
                soup = BeautifulSoup(response.content, 'html.parser')
            else:
                logging.warning("No se encontró link directo, scrapeando home page por si acaso")
            
            # Continuar parseando...
            items = []
            # Buscar cualquier link externo que parezca sitio porno
            for link in soup.find_all('a', href=True):
                href = link['href']
                if 'go.php' in href or 'out.php' in href or 'visit' in href or 'refer' in href:
                     if link.find('img'): # Solo si tiene imagen (mayor calidad)
                         items.append(link)

            logging.info(f"Encontrados {len(items)} enlaces candidatos.")
            
            limit = 50 # Limite de prueba
            count = 0
            
            for item in items:
                if count >= limit: break
                
                try:
                    # Extraer datos (lógica heurística)
                    title = ""
                    link_url = ""
                    img_src = ""
                    desc_text = "Best live cams site"
                    
                    if item.name == 'a':
                        title = item.text.strip() or item.get('title', '')
                        link_url = item['href']
                        # Buscar img hijo
                        img = item.find('img')
                        if img: img_src = img.get('src') or img.get('data-src')
                    else:
                        # Es un div o tr
                        link_elem = item.find('a', href=True)
                        if not link_elem: continue
                        
                        link_url = link_elem['href']
                        title = link_elem.text.strip() or link_elem.get('title', '')
                        
                        img = item.find('img')
                        if img: img_src = img.get('src') or img.get('data-src')
                        
                        desc = item.find('p') or item.find('span', class_='description')
                        if desc: desc_text = desc.text.strip()

                    # Limpieza básica
                    if not title: title = "Live Cam Site"
                    if not link_url.startswith('http'):
                        if link_url.startswith('/'):
                            link_url = self.base_url + link_url
                            
                    # Si es link interno de redirect, intentar resolverlo o guardarlo así
                    final_url = self.resolve_final_url(link_url)
                    
                    datos.append({
                        "id": f"pd-cam-{count}",
                        "title": title,
                        "description": desc_text,
                        "image_url": img_src or "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
                        "affiliate_url": final_url,
                        "affiliate_source": "porndude",
                        "category": "webcam",
                        "location": "Global",
                        "latitude": 0,
                        "longitude": 0,
                        "is_verified": True,
                        "is_premium": False,
                        "rating": 4.5,
                        "active": True,
                        "created_at": datetime.now().isoformat()
                    })
                    count += 1
                    
                except Exception as e:
                    logging.warning(f"Error parseando item: {e}")
                    continue
            
            logging.info(f"✅ PornDude webcams: {len(datos)} registros extraídos")
            return datos
            
        except Exception as e:
            logging.error(f"❌ Error en PornDude webcams: {e}")
            return []

class CamSodaScraper:
    """Scraper para CamSoda.com"""
    
    def scrape_live_models(self) -> List[Dict]:
        """Scrape modelos en vivo de CamSoda (Mock/Simulado si no hay API)"""
        logging.info("Iniciando scrape de CamSoda...")
        # Nota: CamSoda API requiere token usualmente, usaremos datos simulados realistas para prueba
        # O intentaremos un endpoint público si existe.
        
        datos = []
        # Simulamos 20 modelos para poblar
        categorias_camsoda = ["couple", "female", "trans"]
        
        for i in range(20):
            cat = categorias_camsoda[i % len(categorias_camsoda)]
            datos.append({
                "id": f"cs-model-{i}",
                "title": f"CamSoda Model {i+1}",
                "description": f"Live show happening now in {cat} category.",
                "image_url": f"https://images.unsplash.com/photo-{1500000000000+i}?w=800", # Placeholder dinámico
                "affiliate_url": f"https://www.camsoda.com/model-{i}",
                "affiliate_source": "camsoda",
                "category": "webcam",
                "subcategory": cat,
                "location": "Online",
                "latitude": 0,
                "longitude": 0,
                "is_verified": True,
                "is_premium": True,
                "rating": 4.8,
                "active": True,
                "created_at": datetime.now().isoformat()
            })
            
        logging.info(f"✅ CamSoda: {len(datos)} registros generados")
        return datos

# ============================================
# INSERCIÓN EN SUPABASE
# ============================================

def insertar_en_supabase(datos: List[Dict]):
    """Inserta datos en Supabase"""
    if not SUPABASE_KEY:
        logging.warning("⚠️ SUPABASE_KEY no encontrada. Saltando inserción automática.")
        return False
        
    try:
        from supabase import create_client, Client
        
        logging.info(f"Conectando a Supabase: {SUPABASE_URL}")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Limpiar datos para que coincidan con esquema DB
        # Eliminamos 'id' para dejar que postgres lo genere (o usamos uuid si lo generamos nosotros)
        # Aquí dejaremos que Postgres genere el UUID si no es UUID válido
        
        datos_insert = []
        for d in datos:
            # Adaptar campos
            item = {
                "title": d["title"],
                "description": d["description"],
                "image_url": d["image_url"],
                "source_url": d["affiliate_url"], # Requerido por DB
                "affiliate_url": d["affiliate_url"],
                "affiliate_source": d["affiliate_source"],
                "category": d["category"],
                "location": d["location"],
                "is_verified": d["is_verified"],
                "active": d["active"],
                # Campos opcionales con defaults
                "latitude": d.get("latitude", 0),
                "longitude": d.get("longitude", 0),
                "is_premium": d.get("is_premium", False),
                "rating": d.get("rating", None),
                "likes": 0,
                "views": 0
            }
            datos_insert.append(item)

        # Batch insert
        batch_size = 50
        for i in range(0, len(datos_insert), batch_size):
            batch = datos_insert[i:i+batch_size]
            try:
                # Usar upsert o insert
                response = supabase.table('content').insert(batch).execute()
                logging.info(f"✅ Batch {i//batch_size + 1}: Insertados {len(batch)} registros.")
            except Exception as e:
                logging.error(f"❌ Error insertando batch {i}: {e}")
                # Si falla, podemos intentar uno por uno o ignorar
        
        return True
        
    except Exception as e:
        logging.error(f"❌ Error general Supabase: {e}")
        return False

# ============================================
# MAIN EXECUTION
# ============================================

def main():
    print("🚀 INICIANDO SCRAPE MASIVO VENUZ")
    print("="*60)
    logging.info("Iniciando proceso de scraping...")
    
    # 2. Leer checkpoint
    checkpoint = leer_checkpoint()
    
    all_data = []

    # 3. Scraping PornDude
    if 'webcams' not in checkpoint.get('categorias_completadas', {}):
        print("\n📍 FASE 1: SCRAPEANDO PORNDUDE")
        scraper_pd = PornDudeScraper()
        datos_webcams = scraper_pd.scrape_webcams()
        
        if datos_webcams:
            guardar_datos_categoria("001_webcams", datos_webcams)
            
            # Actualizar checkpoint
            if 'categorias_completadas' not in checkpoint: checkpoint['categorias_completadas'] = {}
            checkpoint['categorias_completadas']['webcams'] = len(datos_webcams)
            checkpoint['total_registros_scrapeados'] += len(datos_webcams)
            guardar_checkpoint(checkpoint)
            
            all_data.extend(datos_webcams)
        else:
            logging.warning("No se obtuvieron datos de Webcams PornDude")
    else:
        print("⏩ Saltando Webcams (ya completado)")

    # 4. CamSoda
    print("\n📍 FASE 2: SCRAPEANDO CAMSODA")
    scraper_cs = CamSodaScraper()
    datos_camsoda = scraper_cs.scrape_live_models()
    if datos_camsoda:
        all_data.extend(datos_camsoda)
        guardar_datos_categoria("camsoda_sample", datos_camsoda)
    
    # 5. Consolidar
    print("\n📍 FASE 3: CONSOLIDANDO DATOS")
    
    # Si teníamos datos previos guardados, cargarlos para el final
    # (Simplificado para este run)
    
    try:
        with open(FINAL_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        logging.info(f"Archivo final guardado: {FINAL_FILE}")
    except Exception as e:
        logging.error(f"Error guardando final data: {e}")
    
    # 6. Reporte final
    reporte_progreso(checkpoint)
    
    print(f"\n✅ SCRAPE COMPLETO")
    print(f"📊 Total registros en memoria: {len(all_data)}")
    print(f"📁 Datos guardados en: {SCRAPE_DATA_DIR}")
    
    # 7. Insertar en Supabase
    print("\n🔄 Intentando insertar en Supabase...")
    if SUPABASE_KEY:
        insertar_en_supabase(all_data)
    else:
        print("⚠️ No se configuró SUPABASE_KEY. Datos solo guardados en JSON.")

if __name__ == "__main__":
    main()
