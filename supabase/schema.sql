-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 한 번 실행하세요.

create table if not exists public.transactions (
  id text primary key,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  base_amount bigint not null check (base_amount > 0),
  vat_included boolean not null default false,
  recurring boolean not null default false,
  recurring_group_id text,
  category text not null,
  date date not null,
  method text not null check (method in ('card', 'transfer', 'cash')),
  title text not null,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  category text primary key,
  limit_amount bigint not null check (limit_amount >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_info (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  currency text not null,
  updated_at timestamptz not null default now()
);

insert into public.budgets (category, limit_amount) values
  ('인건비/급여', 4000000),
  ('마케팅/광고', 1000000),
  ('자재/원가', 2000000),
  ('사무실 임차료/공과금', 1500000),
  ('소프트웨어/SaaS', 500000),
  ('사업 운영비', 500000),
  ('세금/공과금', 300000),
  ('기타 지출', 200000)
on conflict (category) do nothing;

insert into public.company_info (id, name, currency)
values (1, '여울 (Yeoul)', '₩')
on conflict (id) do nothing;

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.company_info enable row level security;

revoke all on public.transactions, public.budgets, public.company_info from anon;
grant select, insert, update, delete on public.transactions, public.budgets, public.company_info to authenticated;

drop policy if exists "team members manage transactions" on public.transactions;
create policy "team members manage transactions"
on public.transactions for all to authenticated
using (true) with check (true);

drop policy if exists "team members manage budgets" on public.budgets;
create policy "team members manage budgets"
on public.budgets for all to authenticated
using (true) with check (true);

drop policy if exists "team members manage company info" on public.company_info;
create policy "team members manage company info"
on public.company_info for all to authenticated
using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then alter publication supabase_realtime add table public.transactions; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budgets'
  ) then alter publication supabase_realtime add table public.budgets; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'company_info'
  ) then alter publication supabase_realtime add table public.company_info; end if;
end $$;
