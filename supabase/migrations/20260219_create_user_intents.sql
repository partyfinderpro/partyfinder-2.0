-- Create user_intents table
CREATE TABLE IF NOT EXISTS public.user_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  adult_score INTEGER DEFAULT 50,
  party_score INTEGER DEFAULT 50,
  job_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_intents_user ON public.user_intents(user_id);

-- Enable RLS
ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;

-- Policy for users to own their intents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_intents'
        AND policyname = 'Users own intents'
    ) THEN
        CREATE POLICY "Users own intents" ON public.user_intents USING (auth.uid() = user_id);
    END IF;
END
$$;
