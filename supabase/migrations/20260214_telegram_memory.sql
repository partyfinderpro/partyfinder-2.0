
-- 20260214_telegram_memory.sql

CREATE TABLE IF NOT EXISTS brain_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT DEFAULT 'pablo',
  message TEXT,
  response TEXT,
  type TEXT, -- 'user', 'bot'
  metadata JSONB, -- { category: 'affiliate', url: '...', status: 'pending' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, done
  priority INTEGER DEFAULT 1,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'telegram'
);

-- RLS
ALTER TABLE brain_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages brain memory" ON brain_conversations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages tasks" ON tasks
  FOR ALL USING (auth.role() = 'service_role');
