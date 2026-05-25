-- ──────────────────────────────────────────────────────────────────────────
-- Chativo.ai — Faz 2 infrastructure migration
-- Channel integrations (Telegram + WhatsApp), Live agent, BYOK, Action Builder,
-- White-label branding, Webhooks, Conversation notes.
-- ──────────────────────────────────────────────────────────────────────────

-- ── Organization: BYOK, branding, channel credentials ───────────────────
alter table public.organizations
  add column if not exists byok_anthropic_key_encrypted text,
  add column if not exists byok_openrouter_key_encrypted text,
  add column if not exists telegram_bot_token_encrypted text,
  add column if not exists telegram_bot_username text,
  add column if not exists whatsapp_phone_id text,
  add column if not exists whatsapp_token_encrypted text,
  add column if not exists whatsapp_verify_token text,
  add column if not exists custom_domain text,
  add column if not exists custom_domain_verified_at timestamptz,
  add column if not exists iyzico_customer_id text,
  add column if not exists iyzico_subscription_id text;

create unique index if not exists idx_orgs_custom_domain
  on public.organizations(custom_domain)
  where custom_domain is not null;

create unique index if not exists idx_orgs_iyzico_customer
  on public.organizations(iyzico_customer_id)
  where iyzico_customer_id is not null;

-- Map an inbound WhatsApp phone_id back to an org
create index if not exists idx_orgs_whatsapp_phone
  on public.organizations(whatsapp_phone_id)
  where whatsapp_phone_id is not null;

-- ── Chatbot: model + provider override (multi-model / BYOK) ─────────────
alter table public.chatbots
  add column if not exists model_provider text default 'openai'
    check (model_provider in ('openai','anthropic','openrouter','gemini')),
  add column if not exists model_name text,
  add column if not exists ai_paused boolean not null default false;

-- ── Conversation handoff (live agent) ───────────────────────────────────
-- assigned_user_id already exists from 0001
alter table public.conversations
  add column if not exists ai_paused boolean not null default false,
  add column if not exists handed_over_at timestamptz;

create index if not exists idx_convos_assigned on public.conversations(assigned_user_id)
  where assigned_user_id is not null;

-- ── Internal notes on conversations (agent-only) ────────────────────────
create table if not exists public.conversation_notes (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_notes_convo on public.conversation_notes(conversation_id);

alter table public.conversation_notes enable row level security;
drop policy if exists "notes member all" on public.conversation_notes;
create policy "notes member all" on public.conversation_notes
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ── Channel inbox events (raw incoming for debugging / replay) ──────────
create table if not exists public.channel_events (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete set null,
  channel         channel_type not null,
  external_id     text,
  payload         jsonb not null default '{}'::jsonb,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_chevents_channel_created
  on public.channel_events(channel, created_at);

-- ── Outgoing webhook events (delivery log) ──────────────────────────────
create table if not exists public.webhook_deliveries (
  id                       uuid primary key default uuid_generate_v4(),
  webhook_subscription_id  uuid not null references public.webhook_subscriptions(id) on delete cascade,
  event_type               text not null,
  payload                  jsonb not null,
  response_status          int,
  response_body            text,
  delivered_at             timestamptz,
  failed_at                timestamptz,
  attempt                  int not null default 1,
  created_at               timestamptz not null default now()
);
create index if not exists idx_webhook_deliveries_sub
  on public.webhook_deliveries(webhook_subscription_id, created_at);

-- ──────────────────────────────────────────────────────────────────────────
-- iyzico payments (mirror billing_events for both providers in one table)
-- ──────────────────────────────────────────────────────────────────────────
alter table public.billing_events
  add column if not exists provider text not null default 'stripe'
    check (provider in ('stripe','iyzico'));

-- Touch trigger for conversation_notes
do $$ begin
  drop trigger if exists trg_conversation_notes_updated on public.conversation_notes;
end $$;
