-- Nombre: create_bot_tasks_system
-- Descripción: Sistema de gestión de tareas para Telegram Bot V3

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS public.bot_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL, -- 'scrape', 'optimize', 'cleanup', 'notify', 'analyze'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  priority INTEGER DEFAULT 5, -- 1-10 (10 = crítico)
  title TEXT NOT NULL,
  description TEXT,
  
  -- Datos de ejecución
  scheduled_for TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Resultados
  result JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Metadata
  triggered_by TEXT, -- 'manual', 'cron', 'auto', 'telegram_user'
  telegram_user_id TEXT,
  context JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bot_tasks_status ON public.bot_tasks(status);
CREATE INDEX IF NOT EXISTS idx_bot_tasks_type ON public.bot_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_bot_tasks_priority ON public.bot_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_bot_tasks_scheduled ON public.bot_tasks(scheduled_for);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_bot_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bot_tasks_updated_at ON public.bot_tasks;
CREATE TRIGGER trigger_bot_tasks_updated_at
BEFORE UPDATE ON public.bot_tasks
FOR EACH ROW
EXECUTE FUNCTION update_bot_tasks_updated_at();

-- Tabla de logs de tareas (historial detallado)
CREATE TABLE IF NOT EXISTS public.bot_task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.bot_tasks(id) ON DELETE CASCADE,
  log_level TEXT DEFAULT 'info', -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_task_logs_task ON public.bot_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_bot_task_logs_level ON public.bot_task_logs(log_level);

COMMENT ON TABLE public.bot_tasks IS 'Gestión de tareas del Telegram Bot V3 - tours, scraping, optimización';
COMMENT ON TABLE public.bot_task_logs IS 'Logs detallados de ejecución de tareas del bot';
