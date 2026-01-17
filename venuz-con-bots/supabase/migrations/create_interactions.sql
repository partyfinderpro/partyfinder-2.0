
-- Create interactions table for analytics
create table if not exists public.interactions (
  id uuid default gen_random_uuid() primary key,
  user_id text, -- Can be UUID or 'anonymous'
  content_id uuid references public.content(id) on delete cascade,
  action text not null, -- 'view', 'like', 'share', 'click_map'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.interactions enable row level security;

-- Allow public inserts (for anonymous views)
create policy "Allow public inserts"
  on public.interactions for insert
  with check (true);

-- Allow authenticated users to view their own interactions
create policy "Users can view own interactions"
  on public.interactions for select
  using (auth.uid()::text = user_id);
