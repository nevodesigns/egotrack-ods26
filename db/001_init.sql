-- EgoTrack: the one migration file. Run once at server start (idempotent:
-- every statement uses IF NOT EXISTS, so running it again is harmless).
-- Money is always whole naira integers. Every private table carries shop_id
-- so every query can be filtered to the signed-in shop. See
-- ~/odS_hack/plan/16_BUILD_BLUEPRINT.md section F and section O.

create extension if not exists pgcrypto;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  market text not null,
  state text not null default 'Ogun',
  goods text not null default '',
  phone text not null unique,
  pin_hash text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  market text not null,
  created_at timestamptz not null default now()
);
create index if not exists branches_shop_idx on branches(shop_id);

create table if not exists sessions (
  token text primary key,
  shop_id uuid not null references shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_shop_idx on sessions(shop_id);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique (shop_id, lower(name))
);
create index if not exists customers_shop_idx on customers(shop_id);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  client_id text not null,
  photo_filename text not null,
  status text not null default 'reading'
    check (status in ('reading', 'ready', 'confirmed', 'failed')),
  raw_reader_output jsonb,
  written_page_total integer,
  error_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (shop_id, client_id)
);
create index if not exists pages_shop_idx on pages(shop_id);

-- kind: credit (she is owed) or paid. status: ok, check, left_out.
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  page_id uuid references pages(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  item text not null,
  quantity numeric,
  unit_price integer,
  amount integer not null,
  kind text not null check (kind in ('credit', 'paid')),
  written_date date,
  status text not null default 'ok' check (status in ('ok', 'check', 'left_out')),
  reason text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists records_shop_idx on records(shop_id);
create index if not exists records_customer_idx on records(customer_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid not null references customers(id) on delete cascade,
  amount integer not null,
  client_id text not null,
  created_at timestamptz not null default now(),
  unique (shop_id, client_id)
);
create index if not exists payments_shop_idx on payments(shop_id);
create index if not exists payments_customer_idx on payments(customer_id);

create table if not exists allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  record_id uuid not null references records(id) on delete cascade,
  amount_applied integer not null
);
create index if not exists allocations_payment_idx on allocations(payment_id);
create index if not exists allocations_record_idx on allocations(record_id);

create table if not exists changes (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);
create index if not exists changes_record_idx on changes(record_id);

create table if not exists trust_records (
  code text primary key,
  shop_id uuid not null references shops(id) on delete cascade,
  totals_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true
);
create index if not exists trust_records_shop_idx on trust_records(shop_id);

create table if not exists debt_links (
  code text primary key,
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true
);
create index if not exists debt_links_shop_idx on debt_links(shop_id);
