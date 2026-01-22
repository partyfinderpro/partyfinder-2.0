-- Add UNIQUE constraint to source_url to enable UPSERT operations
ALTER TABLE content ADD CONSTRAINT content_source_url_key UNIQUE (source_url);
