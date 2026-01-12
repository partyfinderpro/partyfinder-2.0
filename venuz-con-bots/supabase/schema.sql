-- VENUZ Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (based on ThePornDude structure)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Regions table (estados/ciudades)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100) DEFAULT 'Mexico',
  state VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content table (scraped content)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  source_url TEXT NOT NULL,
  source_site VARCHAR(255),
  category_id UUID REFERENCES categories(id),
  region_id UUID REFERENCES regions(id),
  type VARCHAR(50), -- 'event', 'club', 'service', 'product'
  tags TEXT[], -- Array of tags
  views INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User interactions (for analytics)
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id),
  user_id VARCHAR(255), -- Anonymous ID from browser
  action VARCHAR(50), -- 'view', 'click', 'share'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_content_region ON content(region_id);
CREATE INDEX idx_content_category ON content(category_id);
CREATE INDEX idx_content_active ON content(active);
CREATE INDEX idx_content_scraped ON content(scraped_at DESC);
CREATE INDEX idx_interactions_content ON interactions(content_id);

-- Insert initial categories (based on ThePornDude)
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Clubes & Eventos', 'clubes-eventos', 'Clubes nocturnos, fiestas y eventos para adultos', '🎉'),
  ('Servicios Adultos', 'servicios-adultos', 'Servicios y entretenimiento para adultos', '💋'),
  ('Productos', 'productos', 'Productos y juguetes sexuales', '🛍️'),
  ('Contenido XXX', 'contenido-xxx', 'Sitios de contenido para adultos', '🔥'),
  ('Citas & Encuentros', 'citas-encuentros', 'Apps y sitios de citas', '💕'),
  ('Webcams', 'webcams', 'Shows en vivo y webcams', '📹'),
  ('OnlyFans', 'onlyfans', 'Modelos y creators de OnlyFans', '⭐');

-- Insert initial regions (ejemplo para México)
INSERT INTO regions (name, slug, country, state, latitude, longitude) VALUES
  ('Guadalajara', 'guadalajara', 'Mexico', 'Jalisco', 20.6597, -103.3496),
  ('Ciudad de México', 'cdmx', 'Mexico', 'CDMX', 19.4326, -99.1332),
  ('Monterrey', 'monterrey', 'Mexico', 'Nuevo León', 25.6866, -100.3161),
  ('Cancún', 'cancun', 'Mexico', 'Quintana Roo', 21.1619, -86.8515),
  ('Tijuana', 'tijuana', 'Mexico', 'Baja California', 32.5149, -117.0382),
  ('Playa del Carmen', 'playa-del-carmen', 'Mexico', 'Quintana Roo', 20.6296, -87.0739),
  ('Puerto Vallarta', 'puerto-vallarta', 'Mexico', 'Jalisco', 20.6534, -105.2253);

-- Enable Row Level Security (optional)
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Public content read access"
  ON content FOR SELECT
  USING (active = true);

CREATE POLICY "Public categories read access"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Public regions read access"
  ON regions FOR SELECT
  USING (true);
