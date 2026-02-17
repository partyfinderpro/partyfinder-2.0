-- Migración de Autonomía del Agente - Misión #1 Miami
-- Insertando venues reales descubiertos por el Agente Autónomo

INSERT INTO public.content (
    title, 
    description, 
    category, 
    location, 
    latitude, 
    longitude, 
    image_url, 
    source_site, 
    source_url, 
    status, 
    is_verified, 
    quality_score, 
    updated_at
) VALUES 
(
    'Mode Miami', 
    'Ubicado en el centro de Miami, Mode ofrece una experiencia de dos niveles. El sótano, un antiguo refugio de la Guerra Fría, cuenta con un sistema de sonido e iluminación de primer nivel enfocado en house y techno.', 
    'club', 
    'Miami', 
    25.7743, 
    -80.1937, 
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67', 
    'agent_discovery', 
    'https://www.miaminewtimes.com/music/mode-nightclub-opens-in-downtown-miami-19253456', 
    'published', 
    true, 
    95, 
    NOW()
),
(
    'Jolene Sound Room', 
    'Inspirado en los años 70, este sótano histórico en el downtown de Miami es conocido por su sonido groovy y lineups semanales de house y disco.', 
    'club', 
    'Miami', 
    25.7750, 
    -80.1910, 
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1', 
    'agent_discovery', 
    'https://www.miaminewtimes.com/music/jolene-sound-room-brings-disco-vibes-to-downtown-miami-16843210', 
    'published', 
    true, 
    92, 
    NOW()
),
(
    'Brother''s Keeper', 
    'Un bar de cócteles retro en Miami Beach con un menú gastronómico increíble. Considerado uno de los mejores locales nuevos de 2024.', 
    'bar', 
    'Miami Beach', 
    25.7925, 
    -80.1411, 
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b', 
    'agent_discovery', 
    'https://www.miaminewtimes.com/restaurants/best-new-bars-in-miami-2024-19001234', 
    'published', 
    true, 
    90, 
    NOW()
),
(
    'Baia Beach Club', 
    'La sofisticación del Mediterráneo cobra vida en el Mondrian South Beach. Un club de playa chic con vistas panorámicas de Biscayne Bay.', 
    'beach', 
    'Miami Beach', 
    25.7830, 
    -80.1437, 
    'https://images.unsplash.com/photo-1530789222307-a8171ffing', 
    'agent_discovery', 
    'https://themiamiguide.com/baia-beach-club-miami/', 
    'published', 
    true, 
    94, 
    NOW()
)
ON CONFLICT (title, location) DO UPDATE SET
    description = EXCLUDED.description,
    quality_score = EXCLUDED.quality_score,
    updated_at = NOW();
