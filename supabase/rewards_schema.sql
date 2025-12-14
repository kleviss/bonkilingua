-- =====================================================
-- BONK Token Rewards System Schema
-- Run this in Supabase SQL Editor after schema.sql
-- =====================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =====================================================
-- Token Rewards Table - Tracks earned rewards
-- =====================================================
create table if not exists token_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount bigint not null,  -- Amount in smallest unit (for BONK: actual tokens, for SOL: lamports)
  token_type text not null default 'BONK',  -- 'BONK', 'SOL', or custom token
  reason text not null,  -- 'correction', 'lesson_complete', 'streak_bonus', 'daily_challenge', 'referral'
  metadata jsonb default '{}',  -- Additional context (e.g., correction_id, lesson_id)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast user lookups
create index if not exists idx_token_rewards_user_id on token_rewards(user_id);
create index if not exists idx_token_rewards_created_at on token_rewards(created_at desc);

-- =====================================================
-- Withdrawal Requests Table - Tracks cashout requests
-- =====================================================
create table if not exists withdrawal_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  wallet_address text not null,  -- Solana wallet address (base58)
  amount bigint not null,  -- Amount to withdraw
  token_type text not null default 'BONK',
  status text not null default 'pending',  -- pending, processing, completed, failed, cancelled
  tx_signature text,  -- Solana transaction signature (set after successful transfer)
  error_message text,  -- Error details if failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  
  -- Validation
  constraint valid_status check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  constraint valid_wallet_address check (length(wallet_address) between 32 and 44)
);

-- Index for processing withdrawals
create index if not exists idx_withdrawal_requests_status on withdrawal_requests(status);
create index if not exists idx_withdrawal_requests_user_id on withdrawal_requests(user_id);

-- =====================================================
-- Add wallet fields to profiles table
-- =====================================================
alter table profiles add column if not exists 
  solana_wallet_address text;

alter table profiles add column if not exists 
  pending_token_balance bigint default 0;

alter table profiles add column if not exists 
  total_tokens_earned bigint default 0;

alter table profiles add column if not exists 
  total_tokens_withdrawn bigint default 0;

-- =====================================================
-- Anti-fraud: Rate limiting table
-- =====================================================
create table if not exists reward_rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  action_type text not null,  -- 'correction', 'lesson', 'withdrawal'
  action_count int default 1,
  window_start timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, action_type, window_start)
);

create index if not exists idx_rate_limits_user on reward_rate_limits(user_id, action_type);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Token rewards: users can only view their own
alter table token_rewards enable row level security;

create policy "Users can view own token rewards" 
  on token_rewards for select 
  using (auth.uid() = user_id);

create policy "Service can insert token rewards" 
  on token_rewards for insert 
  with check (auth.uid() = user_id);

-- Withdrawal requests: users can view and create their own
alter table withdrawal_requests enable row level security;

create policy "Users can view own withdrawal requests" 
  on withdrawal_requests for select 
  using (auth.uid() = user_id);

create policy "Users can create withdrawal requests" 
  on withdrawal_requests for insert 
  with check (auth.uid() = user_id);

-- Rate limits
alter table reward_rate_limits enable row level security;

create policy "Users can view own rate limits" 
  on reward_rate_limits for select 
  using (auth.uid() = user_id);

-- =====================================================
-- Functions for reward management
-- =====================================================

-- Function to add reward and update balance atomically
create or replace function add_token_reward(
  p_user_id uuid,
  p_amount bigint,
  p_reason text,
  p_token_type text default 'BONK',
  p_metadata jsonb default '{}'
) returns uuid as $$
declare
  v_reward_id uuid;
begin
  -- Insert reward record
  insert into token_rewards (user_id, amount, reason, token_type, metadata)
  values (p_user_id, p_amount, p_reason, p_token_type, p_metadata)
  returning id into v_reward_id;
  
  -- Update user's pending balance
  update profiles
  set 
    pending_token_balance = pending_token_balance + p_amount,
    total_tokens_earned = total_tokens_earned + p_amount
  where id = p_user_id;
  
  return v_reward_id;
end;
$$ language plpgsql security definer;

-- Function to process withdrawal (called by backend after successful transfer)
create or replace function complete_withdrawal(
  p_withdrawal_id uuid,
  p_tx_signature text
) returns boolean as $$
declare
  v_user_id uuid;
  v_amount bigint;
begin
  -- Get withdrawal details
  select user_id, amount into v_user_id, v_amount
  from withdrawal_requests
  where id = p_withdrawal_id and status = 'processing';
  
  if v_user_id is null then
    return false;
  end if;
  
  -- Update withdrawal status
  update withdrawal_requests
  set 
    status = 'completed',
    tx_signature = p_tx_signature,
    processed_at = now()
  where id = p_withdrawal_id;
  
  -- Update user's balance
  update profiles
  set 
    pending_token_balance = pending_token_balance - v_amount,
    total_tokens_withdrawn = total_tokens_withdrawn + v_amount
  where id = v_user_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- Function to check rate limit
create or replace function check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_actions int,
  p_window_minutes int
) returns boolean as $$
declare
  v_count int;
  v_window_start timestamp with time zone;
begin
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  select count(*) into v_count
  from reward_rate_limits
  where user_id = p_user_id 
    and action_type = p_action_type
    and window_start > v_window_start;
  
  return v_count < p_max_actions;
end;
$$ language plpgsql security definer;

-- Function to record rate limit action
create or replace function record_rate_limit_action(
  p_user_id uuid,
  p_action_type text
) returns void as $$
begin
  insert into reward_rate_limits (user_id, action_type)
  values (p_user_id, p_action_type);
end;
$$ language plpgsql security definer;

-- =====================================================
-- Reward configuration (editable)
-- =====================================================
create table if not exists reward_config (
  id text primary key,
  amount bigint not null,
  description text,
  active boolean default true,
  updated_at timestamp with time zone default now()
);

-- Insert default reward amounts
insert into reward_config (id, amount, description) values
  ('correction_small', 100, 'Reward for correcting < 10 words'),
  ('correction_medium', 250, 'Reward for correcting 10-50 words'),
  ('correction_large', 500, 'Reward for correcting > 50 words'),
  ('lesson_complete', 200, 'Reward for completing a lesson'),
  ('lesson_save', 100, 'Reward for saving a lesson'),
  ('daily_streak_bonus', 150, 'Daily streak bonus'),
  ('weekly_streak_bonus', 1000, 'Weekly streak bonus (7 days)'),
  ('referral_bonus', 5000, 'Bonus for referring a new user'),
  ('min_withdrawal', 10000, 'Minimum amount for withdrawal')
on conflict (id) do nothing;

