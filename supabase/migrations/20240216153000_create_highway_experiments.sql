-- Nombre: create_highway_experiments
-- Descripción: Sistema de A/B Testing para el motor de recomendaciones Highway

-- 1. Tabla de experimentos
CREATE TABLE IF NOT EXISTS public.highway_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- ej: "party_vs_adult_weight"
  description TEXT,
  variant_a JSONB DEFAULT '{}', -- parámetros base (Control)
  variant_b JSONB DEFAULT '{}', -- parámetros modificados (Test)
  traffic_split INTEGER DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100), -- % de usuarios en B
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de asignaciones (qué usuario tiene qué variante)
CREATE TABLE IF NOT EXISTS public.highway_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Puede ser un ID de usuario autenticado o un ID de sesión/cookie anónimo
  experiment_name TEXT REFERENCES public.highway_experiments(name) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, experiment_name) -- Un usuario solo puede tener una variante por experimento
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_highway_assignments_user ON public.highway_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_highway_assignments_experiment ON public.highway_assignments(experiment_name);
CREATE INDEX IF NOT EXISTS idx_highway_experiments_active ON public.highway_experiments(is_active);

-- 4. RLS (Seguridad)
ALTER TABLE public.highway_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highway_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas (Simplificadas para permitir lectura pública de experimentos activos, escritura controlada por app)
CREATE POLICY "Lectura pública de experimentos activos" ON public.highway_experiments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Lectura de asignaciones propias" ON public.highway_assignments
  FOR SELECT USING (true); -- En producción, filtrar por user_id si es auth

CREATE POLICY "Insertar asignaciones (app)" ON public.highway_assignments
  FOR INSERT WITH CHECK (true);

-- 5. Seed inicial: Experimento de prueba
INSERT INTO public.highway_experiments (name, description, variant_a, variant_b, traffic_split)
VALUES (
  'party_vs_adult_boost',
  'Test: Aumentar peso de adult_score vs party_score en recomendaciones',
  '{"weights": {"party": 1.0, "adult": 1.0}}', 
  '{"weights": {"party": 0.8, "adult": 1.4}}',
  50
) ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.highway_experiments IS 'Configuración de experimentos A/B para el algoritmo Highway';
COMMENT ON TABLE public.highway_assignments IS 'Registro de usuarios asignados a variantes A/B';
