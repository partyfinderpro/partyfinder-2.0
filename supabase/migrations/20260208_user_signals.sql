-- ============================================
-- VENUZ SCE Phase 2: FeedBrain Personalization
-- user_signals table and indexes
-- ============================================

CREATE TABLE IF NOT EXISTS user_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  signal_type text NOT NULL,  -- like, dislike, view_time, scroll_depth, click
  value numeric DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_signals ON user_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_content_signals ON user_signals(content_id);
CREATE INDEX IF NOT EXISTS idx_signal_type ON user_signals(signal_type);

-- Enable RLS
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access signals" ON user_signals
  FOR ALL USING (auth.role() = 'service_role');

-- Allow public insert (with session_id)
CREATE POLICY "Public insert signals" ON user_signals
  FOR INSERT WITH CHECK (true);
