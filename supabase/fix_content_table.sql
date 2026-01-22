-- DROP and RECREATE content table to match the new schema
DROP TABLE IF EXISTS content CASCADE;

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  source_url TEXT NOT NULL,
  source_site VARCHAR(255),
  category_id UUID REFERENCES categories(id),
  region_id UUID REFERENCES regions(id),
  type VARCHAR(50), -- 'event', 'club', 'service', 'product'
  tags TEXT[], -- Array of tags
  views INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  rank_score INTEGER DEFAULT 0, -- TikTok-style algorithm score
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Re-create indexes
CREATE INDEX idx_content_region ON content(region_id);
CREATE INDEX idx_content_category ON content(category_id);
CREATE INDEX idx_content_active ON content(active);
CREATE INDEX idx_content_scraped ON content(scraped_at DESC);
CREATE INDEX idx_content_rank ON content(rank_score DESC);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public content read access"
  ON content FOR SELECT
  USING (active = true);

-- Add UNIQUE constraint to source_url to enable UPSERT operations
ALTER TABLE content ADD CONSTRAINT content_source_url_key UNIQUE (source_url);

