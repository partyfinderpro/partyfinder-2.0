-- =============================================
-- VENUZ - Push Notifications Schema
-- Ejecutar en Supabase SQL Editor
-- Fecha: 6 Febrero 2026
-- =============================================

-- Tabla para guardar suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver/crear/eliminar sus propias suscripciones
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política: Service role puede hacer todo (para el cron)
CREATE POLICY "Service role full access" ON push_subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_modtime
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscription_timestamp();

-- =============================================
-- Verificación
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Push Subscriptions schema creado';
    RAISE NOTICE '   - Tabla: push_subscriptions';
    RAISE NOTICE '   - RLS: Habilitado';
    RAISE NOTICE '   - Trigger: update_push_subscriptions_modtime';
END;
$$;
