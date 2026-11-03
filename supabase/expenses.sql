-- ==============================================================================
-- Table: expenses
-- Description: Stores all user expenses with strict database-level constraints
-- and Row Level Security (RLS) policies as required by FER202 Exam section 2.2.
-- ==============================================================================

-- 1. Create expenses table
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    amount numeric not null check (amount > 0),
    category text not null check (category in ('Food', 'Transport', 'Shopping', 'Bills', 'Other')),
    spent_on date not null,
    note varchar(100) default '' check (char_length(note) <= 100),
    created_at timestamptz not null default now()
);

-- 2. Indexes for performance
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_user_spent_on_idx on public.expenses(user_id, spent_on desc, created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.expenses enable row level security;

-- 4. Clean up any existing policies before re-creating
drop policy if exists "Users can view their own expenses" on public.expenses;
drop policy if exists "Users can insert their own expenses" on public.expenses;
drop policy if exists "Users can delete their own expenses" on public.expenses;

-- 5. RLS Policies (Allow ONLY the actions the app needs: read, add, delete)
-- Rule: A logged-in person can see only their own rows; visitors cannot read.
create policy "Users can view their own expenses"
on public.expenses
for select
to authenticated
using (auth.uid() = user_id);

-- Rule: A logged-in person can add rows only for themselves;
-- A row whose user_id is another person's id is rejected; visitors cannot write.
create policy "Users can insert their own expenses"
on public.expenses
for insert
to authenticated
with check (auth.uid() = user_id);

-- Rule: A logged-in person can delete only their own rows.
create policy "Users can delete their own expenses"
on public.expenses
for delete
to authenticated
using (auth.uid() = user_id);

