-- ============================================
-- VENUZ - ANALYTICS & INTERACTIONS MIGRATION
-- Execute this in Supabase SQL Editor to enable:
-- 1. Interaction Counters (Likes/Views)
-- 2. A/B Testing Tracking
-- 3. Affiliate Conversion Tracking
-- ============================================

-- ============================================
-- 1. INTERACTIONS TABLE & RPCs
-- ============================================

create table if not exists interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null, -- can be uuid or 'anon' or localStorage id
  content_id uuid references content(id) on delete cascade not null,
  action text not null, -- 'like', 'view', 'share'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_interactions_user_content on interactions(user_id, content_id, action);

-- Increment Views
create or replace function increment_views (row_id uuid)
returns void as $$
begin
  update content
  set views = coalesce(views, 0) + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Increment Likes
create or replace function increment_likes (row_id uuid)
returns void as $$
begin
  update content
  set likes = coalesce(likes, 0) + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Decrement Likes
create or replace function decrement_likes (row_id uuid)
returns void as $$
begin
  update content
  set likes = greatest(coalesce(likes, 0) - 1, 0)
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Increment Shares
create or replace function increment_shares (row_id uuid)
returns void as $$
begin
  update content
  set shares = coalesce(shares, 0) + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Update Item Stats (used by tracking.ts)
create or replace function update_item_stats (p_item_id uuid, p_time_spent int, p_clicked boolean)
returns void as $$
begin
  update content
  set 
     -- Logic to update rank_score or similar based on engagement
    rank_score = rank_score + (case when p_clicked then 10 else 0 end) + (case when p_time_spent > 10 then 5 else 0 end)
  where id = p_item_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- 2. A/B TESTING ANALYTICS TABLE
-- ============================================

create table if not exists ab_analytics (
  id uuid default uuid_generate_v4() primary key,
  variant text not null, -- 'control', 'A', 'B', 'C'
  user_id text not null,
  event_type text not null, -- 'assignment', 'like', 'conversion'
  event_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_ab_analytics_variant on ab_analytics(variant);
create index if not exists idx_ab_analytics_created on ab_analytics(created_at);

-- ============================================
-- 3. AFFILIATE CONVERSIONS TABLE
-- ============================================

create table if not exists affiliate_conversions (
  id uuid default uuid_generate_v4() primary key,
  content_id uuid references content(id) on delete set null,
  user_id text,
  affiliate_source text, -- 'camsoda', 'stripchat', etc.
  event_type text default 'click', -- 'click', 'signup', 'purchase'
  user_agent text,
  ip_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_affiliate_conversions_source on affiliate_conversions(affiliate_source);
create index if not exists idx_affiliate_conversions_created on affiliate_conversions(created_at);

-- ============================================
-- 4. PUSH NOTIFICATIONS SUBSCRIPTIONS
-- ============================================

create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id text,
  endpoint text unique not null,
  subscription jsonb not null, -- The full subscription object
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
