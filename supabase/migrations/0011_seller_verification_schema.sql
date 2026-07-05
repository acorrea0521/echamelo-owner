-- App-wide tunable settings (single-row key/value table, admin-editable).
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

insert into app_settings (key, value) values
  ('buyer_verification_threshold_cents', '50000'),
  ('new_account_suspicious_window_minutes', '60');

-- Seller identity/KYC application. One per seller (resubmittable after rejection
-- by re-using the same row — status cycles back to 'draft'/'submitted').
create table seller_applications (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected')),

  legal_full_name text,
  date_of_birth date,
  residence_state text,

  external_store_links jsonb not null default '[]'::jsonb,
  social_media_links jsonb not null default '[]'::jsonb,
  estimated_monthly_sales_range text check (
    estimated_monthly_sales_range is null or estimated_monthly_sales_range in ('0_5k', '5k_20k', '20k_50k', '50k_plus')
  ),

  inventory_photo_urls text[] not null default '{}',
  pitch_video_url text,

  rfc_number text,
  rfc_document_url text,

  stripe_identity_session_id text,
  stripe_identity_status text,
  identity_extracted_name text,

  admin_reviewer_id uuid references profiles(id),
  admin_notes text,
  rejected_reason text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table seller_applications enable row level security;

create index seller_applications_status_idx on seller_applications (status, submitted_at);

-- Seller reads/writes their own application while it's editable; admin bypass
-- goes through the service-role client (see lib/supabase/admin.ts), never RLS.
create policy "seller reads own application"
  on seller_applications for select
  using (auth.uid() = seller_id);

create policy "seller inserts own application"
  on seller_applications for insert
  with check (auth.uid() = seller_id);

create policy "seller updates own draft or changes-requested application"
  on seller_applications for update
  using (auth.uid() = seller_id and status in ('draft', 'changes_requested'))
  with check (auth.uid() = seller_id);

-- Denormalized gate fields on profiles for fast middleware checks without a join.
alter table profiles
  add column seller_status text not null default 'no_aplicado' check (
    seller_status in ('no_aplicado', 'solicitud_pendiente', 'cambios_solicitados', 'aprobado_pendiente_stripe', 'activo', 'rechazado')
  ),
  add column identity_verified_at timestamptz;

-- Buyer-side fields (schema now, logic/UI comes in the next phase).
alter table profiles
  add column buyer_status text not null default 'nuevo' check (buyer_status in ('nuevo', 'verificado', 'bloqueado')),
  add column phone text,
  add column phone_verified_at timestamptz;

alter table listings
  add column requires_verified_buyers boolean not null default false;
