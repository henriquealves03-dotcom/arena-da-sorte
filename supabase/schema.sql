-- Arena da Sorte: starter schema for recreational games with fictional points.
-- Run this in Supabase SQL Editor only after creating the Supabase project.
-- Never store PINs, passwords, CPF, or Pix keys in these tables.
-- Authentication credentials must be managed by Supabase Auth.
-- This schema does not implement betting, cash prizes, or withdrawals.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('game_reward_demo', 'admin_adjustment_demo')),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_refund_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_reference text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.point_ledger enable row level security;
alter table public.purchase_refund_requests enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own point ledger" on public.point_ledger;
create policy "Users can read own point ledger"
  on public.point_ledger for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can submit own purchase refund requests" on public.purchase_refund_requests;
create policy "Users can submit own purchase refund requests"
  on public.purchase_refund_requests for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own purchase refund requests" on public.purchase_refund_requests;
create policy "Users can read own purchase refund requests"
  on public.purchase_refund_requests for select to authenticated
  using (auth.uid() = user_id);

-- Intentionally no client policy for changing point balances or refund status.
-- Use a trusted server/Edge Function with authorization checks for those operations.
