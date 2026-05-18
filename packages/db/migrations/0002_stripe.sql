-- ──────────────────────────────────────────────────────────────────────────
-- Chativo.ai — Stripe billing columns
-- ──────────────────────────────────────────────────────────────────────────

-- Organization-level Stripe identifiers
alter table public.organizations
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists subscription_status    text;     -- 'active' | 'past_due' | 'canceled' | etc

create unique index if not exists idx_orgs_stripe_customer
  on public.organizations(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_orgs_stripe_subscription
  on public.organizations(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Plan → Stripe price IDs (filled in via env at runtime, persisted for the
-- webhook to map back from price_id to plan_id).
alter table public.plans
  add column if not exists stripe_price_monthly text,
  add column if not exists stripe_price_yearly  text;

-- ──────────────────────────────────────────────────────────────────────────
-- Audit table for billing events (idempotency + debug)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.billing_events (
  id              uuid primary key default uuid_generate_v4(),
  stripe_event_id text unique not null,
  type            text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  processed_at    timestamptz not null default now()
);

alter table public.billing_events enable row level security;
-- (no policies → only service role can read/write)
