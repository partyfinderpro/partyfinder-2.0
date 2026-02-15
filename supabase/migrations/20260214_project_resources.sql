
-- 20260214_project_resources.sql

CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('api', 'affiliate_link', 'scraper_source', 'tool', 'reference', 'other')),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT, -- ej: 'free_llm', 'event_scraper', 'adult_affiliate'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'integrated')),
  priority INTEGER DEFAULT 1,
  assigned_to_task UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- RLS
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages project resources" ON project_resources
  FOR ALL USING (auth.role() = 'service_role');
