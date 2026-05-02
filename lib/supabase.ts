import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/*
SQL TO RUN IN SUPABASE DASHBOARD:

create table plans (
  id uuid default gen_random_uuid() primary key,
  advisor_id text not null,
  advisor_slug text not null,
  advisor_firm_name text,
  advisor_logo text,
  ein text,
  plan_number text,
  plan_name text not null,
  employer_domain text,
  recordkeeper text,
  plan_text text,
  status text default 'active',
  sessions_this_month integer default 0,
  registered_at timestamptz default now(),
  unique(ein, plan_number)
);
create index on plans(advisor_id);
create index on plans(ein, plan_number);
alter table plans enable row level security;
create policy "Advisors manage own plans" on plans
  for all using (advisor_id = auth.uid());
*/
