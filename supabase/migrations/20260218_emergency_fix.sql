-- Emergency Fix: Create user_intents and fix visual_style
-- execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  adult_score INTEGER DEFAULT 50,
  party_score INTEGER DEFAULT 50,
  job_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_intents_user ON public.user_intents(user_id);

ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own intents" ON public.user_intents USING (auth.uid() = user_id);

-- Populate visual_style to avoid nulls
UPDATE public.content SET visual_style = '{}' WHERE visual_style IS NULL;
