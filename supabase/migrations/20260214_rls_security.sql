
-- Enable RLS on specific tables
ALTER TABLE IF EXISTS geo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS affiliate_links ENABLE ROW LEVEL SECURITY;

-- Policy: Geo Alerts
-- Users can manage their own alerts
CREATE POLICY "Users can manage their own alerts" ON geo_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Service role has full access (for cron jobs)
CREATE POLICY "Service role full access geo_alerts" ON geo_alerts
  FOR ALL USING (auth.role() = 'service_role');


-- Policy: Content (Public Read, Private Write)
-- Everyone can read active content
CREATE POLICY "Public can view active content" ON content
  FOR SELECT USING (active = true);

-- Only service role (and potentially admin users if role exists) can insert/update/delete content
CREATE POLICY "Service role manages content" ON content
  FOR ALL USING (auth.role() = 'service_role');


-- Policy: Affiliate Links (Public Read, Private Write)
CREATE POLICY "Public can view active affiliates" ON affiliate_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages affiliates" ON affiliate_links
  FOR ALL USING (auth.role() = 'service_role');
