create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  invoice_date date not null default current_date,
  customer_name text not null default '',
  customer_address text not null default '',
  customer_phone text not null default '',
  venue_date date,
  venue_time text not null default '',
  venue_location text not null default 'Indoor',
  items jsonb not null default '[]'::jsonb,
  karaoke boolean not null default false,
  live_music boolean not null default false,
  live_music_fee numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  deposit numeric(14,2) not null default 0,
  remaining numeric(14,2) not null default 0,
  payment_status text not null default 'Belum Lunas',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_invoice_date_idx on public.invoices (invoice_date desc);
create index if not exists invoices_customer_name_idx on public.invoices (lower(customer_name));

alter table public.invoices enable row level security;

drop policy if exists invoices_anon_all on public.invoices;
create policy invoices_anon_all on public.invoices for all to anon using (true) with check (true);
