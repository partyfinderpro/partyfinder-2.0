
-- Tabla de Memoria para VENUZ Core (Cerebro)
-- Almacena estado persistente, tareas pendientes, aprendizajes y configuración dinámica.

CREATE TABLE IF NOT EXISTS venuz_brain_memory (
    key TEXT PRIMARY KEY,       -- Identificador único (ej: 'last_tour_date', 'current_focus', 'learning_log')
    value JSONB NOT NULL,       -- Datos flexibles en formato JSON
    description TEXT,           -- Para que humanos entiendan qué es esto
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs del cerebro (para auditoría de pensamientos/acciones)
CREATE TABLE IF NOT EXISTS venuz_brain_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type TEXT,           -- 'tour', 'reaction', 'correction'
    summary TEXT,               -- Resumen de lo que hizo
    details JSONB               -- Full log, prompt, response
);

-- Permisos (Asumiendo Service Role para el agente, pero policies para dashboard futuro)
ALTER TABLE venuz_brain_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE venuz_brain_logs ENABLE ROW LEVEL SECURITY;

-- Política simple: anon lectura (si dashboard público), service_role full
CREATE POLICY "Public read access for dashboard" ON venuz_brain_logs FOR SELECT USING (true);
