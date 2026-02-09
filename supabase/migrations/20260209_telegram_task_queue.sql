-- ============================================
-- VENUZ SCE: Task Queue para Control Remoto
-- Tabla: dev_tasks
-- 
-- Pablo da órdenes desde Telegram →
-- Se guardan aquí →
-- Claude o Antigravity las ejecutan cuando están activos
-- ============================================

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS dev_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_description text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgente', 'alta', 'normal', 'baja')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to text DEFAULT 'any' CHECK (assigned_to IN ('any', 'claude', 'antigravity', 'grok')),
  created_by text DEFAULT 'pablo_telegram',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  result text,
  notes text
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON dev_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_priority ON dev_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_created ON dev_tasks(created_at DESC);

-- RLS
ALTER TABLE dev_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_tasks" ON dev_tasks;
CREATE POLICY "service_role_full_access_tasks" ON dev_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Verificación
SELECT 'dev_tasks' as tabla, count(*) as registros FROM dev_tasks;
