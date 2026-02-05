-- 003_add_nearby_events_rpc.sql

-- Función RPC para buscar eventos cercanos con filtros
-- Se usa en el Home Feed "Cerca de mí"
CREATE OR REPLACE FUNCTION nearby_events(
  user_lat float,
  user_lon float,
  max_distance_km float,
  cat_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  thumbnail_url text,
  medium_url text,
  large_url text,
  source_url text,
  source_site text,
  category_id uuid,
  region_id uuid,
  latitude float,
  longitude float,
  rank_score float,
  quality_score integer,
  active boolean,
  is_permanent boolean,
  scraped_at timestamp,
  distance_km float
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    c.id, c.title, c.description, c.image_url, c.thumbnail_url, c.medium_url, c.large_url,
    c.source_url, c.source_site, c.category_id, c.region_id, c.latitude, c.longitude,
    c.rank_score, c.quality_score, c.active, c.is_permanent, c.scraped_at,
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(c.latitude)) * 
      cos(radians(c.longitude) - radians(user_lon)) +
      sin(radians(user_lat)) * sin(radians(c.latitude))
    )) as distance_km
  FROM content c
  WHERE 
    c.active = true
    AND (cat_ids IS NULL OR c.category_id = ANY(cat_ids))
    AND (6371 * acos(
      cos(radians(user_lat)) * cos(radians(c.latitude)) * 
      cos(radians(c.longitude) - radians(user_lon)) +
      sin(radians(user_lat)) * sin(radians(c.latitude))
    )) < max_distance_km
  ORDER BY distance_km ASC;
$$;
