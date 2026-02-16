-- Nombre: global_regions_and_referrals
-- Descripción: Infraestructura para expansión global y sistema de referidos virales

-- 1. Tabla de regiones
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- ej: 'nayarit-mx', 'miami-us', 'lisboa-pt'
  name TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  currency TEXT DEFAULT 'MXN',
  is_active BOOLEAN DEFAULT true,
  launched_at TIMESTAMP DEFAULT NOW(),
  meta_data JSONB DEFAULT '{}' -- Para SEO y config específica
);

-- Seed inicial de regiones
INSERT INTO public.regions (code, name, language, currency) VALUES
('nayarit-mx', 'Nayarit, México', 'es', 'MXN'),
('cancun-mx', 'Cancún, México', 'es', 'MXN'),
('miami-us', 'Miami, USA', 'en', 'USD'),
('lisboa-pt', 'Lisboa, Portugal', 'pt', 'EUR')
ON CONFLICT (code) DO NOTHING;

-- 2. Sistema de referidos
-- Añadir referral_code a perfiles (usamos auth.users o una tabla de perfiles si existe)
-- Como no estoy seguro si hay tabla profiles, la creo o actualizo si existe
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES auth.users(id),
    vip_status BOOLEAN DEFAULT false,
    vip_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Función para generar código de referido único aleatorio
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        BEGIN
            INSERT INTO public.user_profiles (id, referral_code) 
            VALUES (auth.uid(), new_code)
            ON CONFLICT (id) DO UPDATE SET referral_code = EXCLUDED.referral_code;
            done := TRUE;
        EXCEPTION WHEN others THEN
            -- Reintenta si hay colisión de código
        END;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 3. RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de regiones" ON public.regions FOR SELECT USING (is_active = true);
CREATE POLICY "Usuarios ven sus perfiles" ON public.user_profiles FOR SELECT USING (id = auth.uid());

COMMENT ON TABLE public.regions IS 'Configuración regional para expansión global';
COMMENT ON TABLE public.user_profiles IS 'Datos extendidos de usuario, incluyendo sistema de referidos';
