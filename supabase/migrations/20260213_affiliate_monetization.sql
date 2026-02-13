-- Migration: 20260213_affiliate_monetization.sql
-- Description: Create affiliate_links table and dummy data for monetization.

CREATE TABLE IF NOT EXISTS affiliate_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform        TEXT NOT NULL CHECK (platform IN ('crakrevenue', 'hotmart', 'clickbank', 'other')),
    affiliate_url   TEXT NOT NULL,
    category        TEXT NOT NULL,
    display_name    TEXT,
    display_image   TEXT,
    cta_text        TEXT DEFAULT 'Ver más',
    priority        INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    clicks_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active_priority ON affiliate_links(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_platform ON affiliate_links(platform);

-- Tabla para tracking de conversiones/clics
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id         UUID REFERENCES affiliate_links(id),
    clicked_at      TIMESTAMPTZ DEFAULT NOW(),
    user_agent      TEXT,
    ip              TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_link_id ON affiliate_conversions(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_clicked_at ON affiliate_conversions(clicked_at);

-- Insertar 2 filas de prueba (dummy)
INSERT INTO affiliate_links (platform, affiliate_url, category, display_name, display_image, cta_text, priority, is_active)
VALUES
  ('hotmart', 'https://example.com/hotmart-dummy?aff=VEN001', 'digital', 'Curso Hotmart Ejemplo', 'https://via.placeholder.com/300x150/6B21A8/D4A017?text=Hotmart+Banner', 'Ver Curso', 10, true),
  ('crakrevenue', 'https://example.com/crak-dummy?tid=VEN002', 'adult', 'Oferta Adulto Ejemplo', 'https://via.placeholder.com/300x150/1A1A2E/FFD700?text=Crak+Banner', 'Explorar', 20, true);
