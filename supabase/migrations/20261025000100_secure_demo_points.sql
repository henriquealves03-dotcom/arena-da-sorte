-- Secure fictional-points ledger for Arena da Sorte.
-- Apply in Supabase SQL Editor before deploying the Edge Function.
-- No monetary value, purchases, cash-outs, or prizes.
alter table public.point_ledger drop constraint if exists point_ledger_reason_check;
alter table public.point_ledger add constraint point_ledger_reason_check
check (reason in ('game_reward_demo', 'admin_adjustment_demo', 'welcome_bonus_demo'));
create table if not exists public.demo_game_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('roulette', 'cards', 'dice', 'reflex')),
  created_at timestamptz not null default now()
);
alter table public.demo_game_events enable row level security;
revoke all on public.demo_game_events from anon, authenticated;
grant select on public.point_ledger to authenticated;
revoke insert, update, delete on public.point_ledger from anon, authenticated;
drop policy if exists "Users can read own point ledger" on public.point_ledger;
create policy "Users can read own point ledger"
  on public.point_ledger for select to authenticated
  using ((select auth.uid()) = user_id);
-- Intentionally no client INSERT/UPDATE/DELETE policy on point_ledger.
-- Only the trusted Edge Function writes entries after authenticating the caller.
