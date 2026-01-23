-- ============================================================
-- VENUZ - SQL FASE 2: Engagement, Chat y Geolocalización
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. EXTENDER TABLA PROFILLES (Si no existe, crearla y linkear con Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  username text UNIQUE,
  city text DEFAULT 'CDMX',
  avatar_url text,
  is_verified boolean DEFAULT false,
  role text DEFAULT 'user' CHECK (role IN ('user', 'model', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABLA DE MENSAJES PARA CHAT REAL-TIME
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Índices para chat rápido
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);

-- RLS para MENSAJES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios chats" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Usuarios pueden enviar mensajes" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 3. FUNCIONES RPC PARA ANALYTICS AVANZADO (Para Recharts)

-- RPC: Conteo de usuarios por ciudad
CREATE OR REPLACE FUNCTION public.get_user_cities_count()
RETURNS TABLE (city text, count bigint)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT city, COUNT(*) as count 
  FROM public.profiles 
  GROUP BY city 
  ORDER BY count DESC;
$$;

-- RPC: Crecimiento de usuarios por mes
CREATE OR REPLACE FUNCTION public.get_user_growth_by_month()
RETURNS TABLE (month text, new_users bigint)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) as new_users
  FROM auth.users
  GROUP BY month
  ORDER BY month;
$$;


-- 4. PERMISOS
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cities_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_growth_by_month TO authenticated;


-- 5. STORAGE BUCKET (Instrucción: Crear manualmente en Supabase Dashboard)
-- Nombre: content-media
-- Public: True
-- RLS Policy: Authenticated users can upload
