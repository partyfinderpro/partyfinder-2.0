#!/usr/bin/env python3
# scraper_playwright.py - ANTIGRAVITY + PLAYWRIGHT = ÉXITO
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import asyncio
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

SCRAPE_DATA_DIR = r"C:\Users\pablo\Downloads\VENUZ-Complete-App\venuz-app\scrape-data"
os.makedirs(SCRAPE_DATA_DIR, exist_ok=True)

async def scrape_porndude_live():
    """Scrape PornDude Live Cams con navegador real"""
    print("🚀 Iniciando Playwright...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        print("📍 Navegando a PornDude Live Cams...")
        
        try:
            # Ir a la página de live cams
            await page.goto('https://www.theporndude.com/', wait_until='networkidle', timeout=30000)
            print("✅ Página cargada")
            
            # Buscar link a Live Cams y hacer click
            live_cams_link = await page.query_selector('a:has-text("Live")')
            if live_cams_link:
                await live_cams_link.click()
                await page.wait_for_load_state('networkidle')
                print("✅ Navegado a sección Live Cams")
            
            # Esperar un poco para que cargue todo
            await page.wait_for_timeout(3000)
            
            # Scroll para cargar lazy content
            for i in range(3):
                await page.evaluate('window.scrollBy(0, 1000)')
                await page.wait_for_timeout(500)
            
            # Obtener HTML completo
            html = await page.content()
            
            # Guardar HTML para debug
            html_file = os.path.join(SCRAPE_DATA_DIR, "porndude_raw.html")
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"💾 HTML guardado: {html_file}")
            
            # Parsear con BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            datos = []
            
            # Buscar todos los links externos (afiliados)
            # PornDude usa varios patrones
            all_links = soup.find_all('a', href=True)
            print(f"🔍 Encontrados {len(all_links)} links en total")
            
            seen_urls = set()
            
            for link in all_links:
                href = link.get('href', '')
                
                # Filtrar solo links de afiliados/externos
                if any(x in href for x in ['/go/', '/out/', '/visit/', 'click.', 'track.']):
                    if href in seen_urls:
                        continue
                    seen_urls.add(href)
                    
                    # Extraer título
                    title = link.get_text(strip=True)
                    if not title:
                        title = link.get('title', '')
                    if not title:
                        img = link.find('img')
                        if img:
                            title = img.get('alt', 'Cam Site')
                    
                    # Extraer imagen
                    img = link.find('img')
                    img_src = img.get('src', '') if img else ''
                    if not img_src:
                        img_src = img.get('data-src', '') if img else ''
                    
                    if title and len(title) > 2:
                        datos.append({
                            "title": title[:100],  # Limitar longitud
                            "description": f"Discover {title} - Premium live cam experience",
                            "image_url": img_src or "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
                            "source_url": href,
                            "affiliate_url": href,
                            "affiliate_source": "porndude",
                            "category": "webcam",
                            "subcategory": "live",
                            "location": "Online",
                            "latitude": 0,
                            "longitude": 0,
                            "is_verified": True,
                            "is_premium": True,
                            "rating": 4.5,
                            "likes": 0,
                            "views": 0,
                            "active": True,
                            "created_at": datetime.now().isoformat()
                        })
            
            print(f"✅ Extraídos {len(datos)} sitios de cams")
            
            # Si no encontramos suficientes, buscar también en elementos con clase
            if len(datos) < 10:
                print("🔍 Buscando en elementos estructurados...")
                
                # Buscar divs que parezcan cards de sitios
                cards = soup.find_all(['div', 'article', 'li'], class_=lambda x: x and any(k in str(x).lower() for k in ['site', 'card', 'item', 'list']))
                print(f"   Encontradas {len(cards)} cards")
                
                for card in cards:
                    link = card.find('a', href=True)
                    if not link:
                        continue
                    
                    href = link.get('href', '')
                    if href in seen_urls:
                        continue
                    
                    title = card.find(['h2', 'h3', 'h4', 'strong'])
                    title_text = title.get_text(strip=True) if title else link.get_text(strip=True)
                    
                    if title_text and len(title_text) > 2:
                        seen_urls.add(href)
                        img = card.find('img')
                        img_src = img.get('src', '') if img else ''
                        
                        datos.append({
                            "title": title_text[:100],
                            "description": f"Visit {title_text} - Top rated adult entertainment",
                            "image_url": img_src or "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
                            "source_url": href,
                            "affiliate_url": href,
                            "affiliate_source": "porndude",
                            "category": "webcam",
                            "location": "Online",
                            "latitude": 0,
                            "longitude": 0,
                            "is_verified": True,
                            "is_premium": False,
                            "rating": 4.0,
                            "active": True,
                            "created_at": datetime.now().isoformat()
                        })
                
                print(f"✅ Total después de búsqueda ampliada: {len(datos)}")
            
            await browser.close()
            return datos
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await browser.close()
            return []

async def scrape_multiple_categories():
    """Scrape múltiples categorías de PornDude"""
    print("🚀 Iniciando scrape multi-categoría...")
    
    categories = [
        ('https://www.theporndude.com/', 'general'),
        ('https://www.theporndude.com/best-porn-sites', 'tubes'),
    ]
    
    all_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        for url, cat_name in categories:
            print(f"\n📍 Scrapeando: {cat_name}")
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)
                
                # Scroll
                for _ in range(5):
                    await page.evaluate('window.scrollBy(0, 800)')
                    await page.wait_for_timeout(300)
                
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Buscar links
                links = soup.find_all('a', href=True)
                seen = set()
                
                for link in links:
                    href = link.get('href', '')
                    if '/go/' in href or '/out/' in href:
                        if href not in seen:
                            seen.add(href)
                            title = link.get_text(strip=True) or 'Adult Site'
                            if len(title) > 2 and len(title) < 100:
                                all_data.append({
                                    "title": title,
                                    "description": f"Explore {title}",
                                    "image_url": "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800",
                                    "source_url": href,
                                    "affiliate_url": href,
                                    "affiliate_source": "porndude",
                                    "category": cat_name,
                                    "location": "Online",
                                    "is_verified": True,
                                    "active": True,
                                    "created_at": datetime.now().isoformat()
                                })
                
                print(f"   ✅ {len(seen)} sitios encontrados en {cat_name}")
                
            except Exception as e:
                print(f"   ⚠️ Error en {cat_name}: {e}")
        
        await browser.close()
    
    return all_data

def insertar_en_supabase(datos):
    """Insertar datos en Supabase"""
    try:
        from supabase import create_client
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://jbrmziwosyeructvlvrq.supabase.co")
        key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not key:
            print("⚠️ No hay SUPABASE_KEY, saltando inserción")
            return False
        
        supabase = create_client(url, key)
        
        # Preparar datos
        datos_insert = []
        for d in datos:
            datos_insert.append({
                "title": d["title"],
                "description": d["description"],
                "image_url": d["image_url"],
                "source_url": d["source_url"],
                "affiliate_url": d["affiliate_url"],
                "affiliate_source": d["affiliate_source"],
                "category": d.get("category", "webcam"),
                "location": d.get("location", "Online"),
                "is_verified": d.get("is_verified", True),
                "active": d.get("active", True),
            })
        
        # Batch insert (evitando duplicados)
        batch_size = 50
        inserted = 0
        for i in range(0, len(datos_insert), batch_size):
            batch = datos_insert[i:i+batch_size]
            try:
                response = supabase.table('content').upsert(batch, on_conflict='source_url').execute()
                inserted += len(batch)
                print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} registros")
            except Exception as e:
                print(f"   ⚠️ Error batch: {e}")
        
        print(f"✅ Total insertados: {inserted}")
        return True
        
    except Exception as e:
        print(f"❌ Error Supabase: {e}")
        return False

async def main():
    print("="*60)
    print("🚀 ANTIGRAVITY PLAYWRIGHT SCRAPER")
    print("="*60)
    
    # Scrape PornDude
    datos = await scrape_porndude_live()
    
    # Si encontramos pocos, intentar multi-categoría
    if len(datos) < 20:
        print("\n📍 Intentando scrape multi-categoría...")
        datos_extra = await scrape_multiple_categories()
        datos.extend(datos_extra)
    
    # Eliminar duplicados por source_url
    seen = set()
    unique_datos = []
    for d in datos:
        if d['source_url'] not in seen:
            seen.add(d['source_url'])
            unique_datos.append(d)
    
    print(f"\n📊 Total sitios únicos: {len(unique_datos)}")
    
    # Guardar JSON
    output_file = os.path.join(SCRAPE_DATA_DIR, "PORNDUDE_SCRAPED.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_datos, f, indent=2, ensure_ascii=False)
    print(f"💾 Guardado: {output_file}")
    
    # Insertar en Supabase
    if unique_datos:
        print("\n🔄 Insertando en Supabase...")
        insertar_en_supabase(unique_datos)
    
    print("\n" + "="*60)
    print("✅ SCRAPE COMPLETO")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
