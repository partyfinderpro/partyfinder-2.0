
-- Create table for tracking content improvements and closed-loop feedback
CREATE TABLE IF NOT EXISTS content_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_content_id UUID REFERENCES content(id), -- Assuming 'content' table exists, otherwise references logic needs adjustment
  improved_title TEXT,
  improved_description TEXT,
  keywords TEXT[],
  quality_score_before INTEGER,
  quality_score_after INTEGER,
  ctr_before DECIMAL DEFAULT 0,
  ctr_after DECIMAL DEFAULT 0,
  improved_at TIMESTAMPTZ DEFAULT NOW(),
  feedback_score INTEGER DEFAULT 0,
  provider_used TEXT
);

-- Index for faster analysis
CREATE INDEX IF NOT EXISTS idx_content_improvements_date ON content_improvements(improved_at);
CREATE INDEX IF NOT EXISTS idx_content_improvements_feedback ON content_improvements(feedback_score);
