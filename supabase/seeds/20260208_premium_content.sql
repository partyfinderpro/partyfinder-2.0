-- ============================================
-- VENUZ UPDATE: Poblar contenido premium demostrativo - CORREGIDO (Postgres Compatible)
-- Convertir items clave a Premium con Video
-- ============================================

-- 1. Convertir Stripchat/Camsoda items a Premium Video
UPDATE content SET
  preview_type = 'video',
  preview_video_url = 'https://customer-67c346a066266023.cloudflarestream.com/b2803c00427c385805dc29e313540131/manifest/video.m3u8',
  content_tier = 'premium',
  has_affiliate = true,
  affiliate_url = CASE 
    WHEN source_url LIKE '%stripchat%' THEN 'https://stripchat.com/?aff=venuz'
    ELSE 'https://camsoda.com/?aff=venuz'
  END,
  quality_score = 95,
  is_featured = true
WHERE id IN (
    SELECT id FROM content 
    WHERE (title ILIKE '%stripchat%' OR title ILIKE '%camsoda%' OR category = 'webcam')
    AND active = true
    LIMIT 10
);

-- 2. Convertir algunos Eventos Top a Verified con Video
-- FIX: Usamos subquery porque UPDATE no soporta LIMIT directo en Postgres
UPDATE content SET
  preview_type = 'video',
  preview_video_url = 'https://customer-67c346a066266023.cloudflarestream.com/4950ab9c21822709088682a88a088aca/manifest/video.m3u8',
  content_tier = 'verified',
  quality_score = 90,
  is_verified = true
WHERE id IN (
    SELECT id FROM content 
    WHERE category IN ('club', 'evento') 
    AND active = true
    LIMIT 10
);

-- 3. Asegurar que las imágenes no sean nulas en premium
UPDATE content SET
  image_url = 'https://images.unsplash.com/photo-1542833675-9b8830b05b8?q=80&w=1000&auto=format&fit=crop'
WHERE content_tier = 'premium' AND (image_url IS NULL OR image_url = '');
