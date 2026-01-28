-- ============================================
-- VENUZ MIGRATION 005: Populate Test Data
-- Execute in Supabase SQL Editor (OPTIONAL)
-- Date: 2026-01-27
-- ============================================

-- This script populates the database with sample data for testing
-- Run this ONLY in development or if your DB is empty

-- ========== STEP 1: Ensure categories exist ==========
INSERT INTO categories (name, slug, description, icon) VALUES
    ('Clubes & Eventos', 'clubes-eventos', 'Clubes nocturnos, fiestas y eventos', '🎉'),
    ('Bares', 'bares', 'Bares y cantinas', '🍺'),
    ('Conciertos', 'conciertos', 'Shows en vivo y conciertos', '🎸'),
    ('Restaurantes', 'restaurantes', 'Restaurantes y comida', '🍽️'),
    ('Servicios', 'servicios', 'Servicios para adultos', '💋'),
    ('Webcams', 'webcams', 'Shows en vivo online', '📹'),
    ('OnlyFans', 'onlyfans', 'Creadores de contenido', '⭐'),
    ('Citas', 'citas', 'Apps y sitios de citas', '💕')
ON CONFLICT (slug) DO NOTHING;

-- ========== STEP 2: Ensure regions exist ==========
INSERT INTO regions (name, slug, country, state, latitude, longitude) VALUES
    ('Guadalajara', 'guadalajara', 'Mexico', 'Jalisco', 20.6597, -103.3496),
    ('Ciudad de México', 'cdmx', 'Mexico', 'CDMX', 19.4326, -99.1332),
    ('Monterrey', 'monterrey', 'Mexico', 'Nuevo León', 25.6866, -100.3161),
    ('Cancún', 'cancun', 'Mexico', 'Quintana Roo', 21.1619, -86.8515),
    ('Tijuana', 'tijuana', 'Mexico', 'Baja California', 32.5149, -117.0382),
    ('Puerto Vallarta', 'puerto-vallarta', 'Mexico', 'Jalisco', 20.6534, -105.2253),
    ('Playa del Carmen', 'playa-del-carmen', 'Mexico', 'Quintana Roo', 20.6296, -87.0739),
    ('Mérida', 'merida', 'Mexico', 'Yucatán', 20.9674, -89.5926),
    ('Acapulco', 'acapulco', 'Mexico', 'Guerrero', 16.8531, -99.8237),
    ('Los Cabos', 'los-cabos', 'Mexico', 'Baja California Sur', 22.8905, -109.9167)
ON CONFLICT (slug) DO NOTHING;

-- ========== STEP 3: Insert sample content ==========

-- Get category and region IDs
DO $$
DECLARE
    cat_club UUID;
    cat_bar UUID;
    cat_concierto UUID;
    cat_webcam UUID;
    reg_gdl UUID;
    reg_cdmx UUID;
    reg_mty UUID;
    reg_cancun UUID;
    reg_pv UUID;
BEGIN
    SELECT id INTO cat_club FROM categories WHERE slug = 'clubes-eventos' LIMIT 1;
    SELECT id INTO cat_bar FROM categories WHERE slug = 'bares' LIMIT 1;
    SELECT id INTO cat_concierto FROM categories WHERE slug = 'conciertos' LIMIT 1;
    SELECT id INTO cat_webcam FROM categories WHERE slug = 'webcams' LIMIT 1;
    
    SELECT id INTO reg_gdl FROM regions WHERE slug = 'guadalajara' LIMIT 1;
    SELECT id INTO reg_cdmx FROM regions WHERE slug = 'cdmx' LIMIT 1;
    SELECT id INTO reg_mty FROM regions WHERE slug = 'monterrey' LIMIT 1;
    SELECT id INTO reg_cancun FROM regions WHERE slug = 'cancun' LIMIT 1;
    SELECT id INTO reg_pv FROM regions WHERE slug = 'puerto-vallarta' LIMIT 1;

    -- Insert sample content
    INSERT INTO content (
        title, description, image_url, source_url, source_site,
        category_id, region_id, category, location,
        latitude, longitude, type, tags,
        is_verified, is_premium, is_open_now, open_until,
        views, likes, rating, active
    ) VALUES
    (
        'Noche Latina @ Club Mandala',
        'La mejor fiesta latina de la ciudad con DJ internacional. Dresscode elegante.',
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
        'https://example.com/mandala', 'VENUZ',
        cat_club, reg_gdl, 'Clubes & Eventos', 'Guadalajara',
        20.6745, -103.3640, 'club', ARRAY['latino', 'dj', 'noche'],
        true, false, true, '4:00 AM',
        1523, 234, 4.5, true
    ),
    (
        'Bar La Fuente - Rooftop Session',
        'Cócteles artesanales con vista a la ciudad. Happy hour 6-9 PM.',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
        'https://example.com/lafuente', 'VENUZ',
        cat_bar, reg_cdmx, 'Bares', 'Ciudad de México',
        19.4233, -99.1674, 'bar', ARRAY['rooftop', 'cocteles', 'vista'],
        true, true, true, '2:00 AM',
        3421, 567, 4.8, true
    ),
    (
        'Concierto Rock Nacional - Foro Sol',
        'Festival de rock mexicano con las mejores bandas del momento.',
        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
        'https://example.com/forosol', 'VENUZ',
        cat_concierto, reg_cdmx, 'Conciertos', 'Ciudad de México',
        19.4038, -99.0977, 'evento', ARRAY['rock', 'concierto', 'festival'],
        true, false, false, NULL,
        8934, 1245, 4.7, true
    ),
    (
        'Beach Club Cancún - Pool Party',
        'La pool party más exclusiva del Caribe mexicano. Open bar incluido.',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
        'https://example.com/beachclub', 'VENUZ',
        cat_club, reg_cancun, 'Clubes & Eventos', 'Cancún',
        21.1321, -86.7613, 'club', ARRAY['pool', 'party', 'playa', 'vip'],
        true, true, true, '6:00 PM',
        5678, 890, 4.9, true
    ),
    (
        'Sofia - Live Show',
        'Modelo verificada disponible para shows privados.',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
        'https://camsoda.com/sofia', 'CamSoda',
        cat_webcam, reg_pv, 'Webcams', 'Puerto Vallarta',
        20.6534, -105.2253, 'webcam', ARRAY['live', 'modelo', 'privado'],
        true, true, true, NULL,
        12456, 2345, 4.6, true
    ),
    (
        'Club Mónaco - Tech House Night',
        'Lo mejor del tech house con DJs internacionales.',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
        'https://example.com/monaco', 'VENUZ',
        cat_club, reg_mty, 'Clubes & Eventos', 'Monterrey',
        25.6714, -100.3096, 'club', ARRAY['techhouse', 'electro', 'dj'],
        true, false, true, '5:00 AM',
        4532, 678, 4.4, true
    ),
    (
        'Mezcalería Tradicional',
        'Más de 100 mezcales artesanales de Oaxaca. Experiencia única.',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        'https://example.com/mezcaleria', 'VENUZ',
        cat_bar, reg_gdl, 'Bares', 'Guadalajara',
        20.6689, -103.3494, 'bar', ARRAY['mezcal', 'oaxaca', 'artesanal'],
        true, false, true, '1:00 AM',
        2156, 432, 4.7, true
    ),
    (
        'Zona Rosa - Pub Crawl',
        'Recorrido por los mejores bares de la Zona Rosa. Incluye shots gratis.',
        'https://images.unsplash.com/photo-1575037614876-c38a4c44f5bd?w=800&q=80',
        'https://example.com/pubcrawl', 'VENUZ',
        cat_bar, reg_cdmx, 'Bares', 'Ciudad de México',
        19.4271, -99.1542, 'evento', ARRAY['pubcrawl', 'zonarosa', 'fiesta'],
        false, false, true, '3:00 AM',
        876, 123, 4.2, true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sample data inserted successfully!';
END $$;

-- ========== STEP 4: Update geo_points for new content ==========
UPDATE content 
SET geo_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
AND longitude IS NOT NULL 
AND geo_point IS NULL;

-- ========== VERIFICATION ==========
-- SELECT id, title, category, location, latitude, longitude, is_verified, likes 
-- FROM content 
-- WHERE active = true 
-- ORDER BY created_at DESC;
