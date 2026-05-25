-- ──────────────────────────────────────────────────────────────────────────
-- Chativo.ai — Initial schema (Faz 1 MVP)
-- Extensions, enums, tables, indexes, RLS policies.
-- ──────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";          -- pgvector for embeddings

-- ── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  -- Channel: web in MVP. whatsapp/telegram/slack are Faz 2 — included for
  -- forward-compatible schema; app layer rejects them until implemented.
  create type channel_type as enum ('web', 'whatsapp', 'telegram', 'slack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_role as enum ('owner', 'admin', 'agent', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_type as enum (
    'website', 'pdf', 'docx', 'txt', 'manual', 'faq',
    -- Faz 2 placeholders (app rejects with 'not_implemented')
    'sitemap', 'youtube', 'notion', 'google_docs', 'csv', 'api'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_status as enum ('pending', 'processing', 'completed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bot_tone as enum ('professional', 'friendly', 'concise', 'sales');
exception when duplicate_object then null; end $$;

do $$ begin
  create type answer_length as enum ('short', 'normal', 'detailed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_role as enum ('user', 'assistant', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type widget_position as enum ('bottom-right', 'bottom-left');
exception when duplicate_object then null; end $$;

do $$ begin
  create type theme_mode as enum ('light', 'dark', 'system');
exception when duplicate_object then null; end $$;

-- ── profiles (extends auth.users) ────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  avatar_url  text,
  locale      text not null default 'tr' check (locale in ('tr','en')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── plans (catalog) ──────────────────────────────────────────────────────
create table if not exists public.plans (
  id                       text primary key,            -- 'free' | 'starter' | 'pro' | 'agency'
  name                     text not null,
  monthly_message_limit    int  not null,
  chatbot_limit            int  not null,
  source_limit             int  not null,
  file_size_limit_mb       int  not null default 25,
  team_members_limit       int  not null default 1,
  remove_branding          boolean not null default false,
  white_label              boolean not null default false,
  price_monthly_usd        numeric(10,2) not null default 0,
  price_yearly_usd         numeric(10,2) not null default 0,
  created_at               timestamptz not null default now()
);

insert into public.plans (id, name, monthly_message_limit, chatbot_limit, source_limit, team_members_limit, remove_branding, white_label, price_monthly_usd, price_yearly_usd) values
  ('free',    'Free',    50,    1,  10, 1,  false, false, 0,    0),
  ('starter', 'Starter', 1000,  1,  5,  2,  false, false, 19,   190),
  ('pro',     'Pro',     10000, 5,  25, 5,  true,  false, 49,   490),
  ('agency',  'Agency',  50000, 25, 100,15, true,  true,  149,  1490)
on conflict (id) do nothing;

-- ── organizations (tenant) ───────────────────────────────────────────────
create table if not exists public.organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  owner_id    uuid not null references public.profiles(id) on delete restrict,
  plan_id     text not null default 'free' references public.plans(id),
  branding    jsonb not null default '{}'::jsonb,  -- Faz 2 white-label
  byok_openai_key_encrypted text,                  -- Faz 2 BYOK (encrypted)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_organizations_owner on public.organizations(owner_id);

-- ── organization_members ─────────────────────────────────────────────────
create table if not exists public.organization_members (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            member_role not null default 'owner',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org  on public.organization_members(organization_id);

-- ── chatbots ─────────────────────────────────────────────────────────────
create table if not exists public.chatbots (
  id                         uuid primary key default uuid_generate_v4(),
  organization_id            uuid not null references public.organizations(id) on delete cascade,
  name                       text not null,
  business_name              text,
  language                   text not null default 'auto' check (language in ('tr','en','auto')),
  purpose                    text not null default 'support',
  tone                       bot_tone not null default 'friendly',
  answer_length              answer_length not null default 'normal',
  welcome_message            text,
  fallback_message           text,
  primary_color              text not null default '#6554E8',
  logo_url                   text,
  avatar_url                 text,
  widget_position            widget_position not null default 'bottom-right',
  theme                      theme_mode not null default 'light',
  quick_questions            jsonb not null default '[]'::jsonb,
  is_active                  boolean not null default true,
  allowed_domains            text[] not null default '{}',
  strict_knowledge_base      boolean not null default true,
  show_lead_form_on_fallback boolean not null default true,
  actions                    jsonb not null default '[]'::jsonb,    -- Faz 2 action builder
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index if not exists idx_chatbots_org on public.chatbots(organization_id);

-- ── knowledge_sources ────────────────────────────────────────────────────
create table if not exists public.knowledge_sources (
  id              uuid primary key default uuid_generate_v4(),
  chatbot_id      uuid not null references public.chatbots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type            source_type not null,
  title           text not null,
  source_url      text,
  file_url        text,
  raw_text        text,
  status          source_status not null default 'pending',
  error_message   text,
  chunk_count     int not null default 0,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_sources_chatbot on public.knowledge_sources(chatbot_id);
create index if not exists idx_sources_org     on public.knowledge_sources(organization_id);
create index if not exists idx_sources_status  on public.knowledge_sources(status);

-- ── knowledge_chunks (vector store) ──────────────────────────────────────
create table if not exists public.knowledge_chunks (
  id              uuid primary key default uuid_generate_v4(),
  chatbot_id      uuid not null references public.chatbots(id) on delete cascade,
  source_id       uuid not null references public.knowledge_sources(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content         text not null,
  embedding       vector(1536),                              -- text-embedding-3-small
  metadata        jsonb not null default '{}'::jsonb,
  token_count     int,
  created_at      timestamptz not null default now()
);
create index if not exists idx_chunks_chatbot on public.knowledge_chunks(chatbot_id);
create index if not exists idx_chunks_source  on public.knowledge_chunks(source_id);
-- pgvector IVFFlat index (creates after some data exists, otherwise HNSW is heavier)
create index if not exists idx_chunks_embedding
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── conversations ────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id                uuid primary key default uuid_generate_v4(),
  chatbot_id        uuid not null references public.chatbots(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  visitor_id        text not null,                       -- anon UUID stored client-side
  channel           channel_type not null default 'web',
  lead_id           uuid,
  assigned_user_id  uuid references public.profiles(id), -- Faz 2 live agent
  rating            smallint check (rating between -1 and 1),
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_convos_chatbot on public.conversations(chatbot_id);
create index if not exists idx_convos_org     on public.conversations(organization_id);
create index if not exists idx_convos_visitor on public.conversations(visitor_id);

-- ── messages ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  chatbot_id      uuid not null references public.chatbots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role            message_role not null,
  content         text not null,
  sources_used    jsonb not null default '[]'::jsonb,
  token_count     int,
  latency_ms      int,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_convo on public.messages(conversation_id);
create index if not exists idx_messages_org_created on public.messages(organization_id, created_at);

-- ── leads ────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id              uuid primary key default uuid_generate_v4(),
  chatbot_id      uuid not null references public.chatbots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  name            text,
  email           text,
  phone           text,
  company         text,
  message         text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_leads_chatbot on public.leads(chatbot_id);
create index if not exists idx_leads_org     on public.leads(organization_id);

-- Backfill FK from conversations.lead_id now that leads exists
alter table public.conversations
  drop constraint if exists conversations_lead_id_fkey,
  add constraint conversations_lead_id_fkey
    foreign key (lead_id) references public.leads(id) on delete set null;

-- ── usage_logs (daily aggregate per chatbot) ─────────────────────────────
create table if not exists public.usage_logs (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chatbot_id      uuid references public.chatbots(id) on delete cascade,
  date            date not null,
  message_count   int  not null default 0,
  token_count     int  not null default 0,
  embedding_token_count int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, chatbot_id, date)
);
create index if not exists idx_usage_org_date on public.usage_logs(organization_id, date);

-- ── widget_events (raw analytics) ────────────────────────────────────────
create table if not exists public.widget_events (
  id              uuid primary key default uuid_generate_v4(),
  chatbot_id      uuid not null references public.chatbots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  visitor_id      text,
  event_type      text not null,        -- 'open','close','message','lead','rating'
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_events_chatbot_created on public.widget_events(chatbot_id, created_at);

-- ── audit_logs (admin) ───────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ── Faz 2 placeholder: webhook_subscriptions (empty, RLS-ready) ──────────
create table if not exists public.webhook_subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url             text not null,
  events          text[] not null default '{}',
  secret          text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array[
    'profiles','organizations','chatbots','knowledge_sources',
    'conversations','usage_logs'
  ] loop
    execute format(
      'drop trigger if exists trg_%I_updated on public.%I;
       create trigger trg_%I_updated before update on public.%I
       for each row execute function public.touch_updated_at();', t, t, t, t);
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- New user trigger — auto-create profile + personal organization
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id uuid;
  new_slug   text;
begin
  insert into public.profiles (id, email, name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
    on conflict (id) do nothing;

  new_slug := regexp_replace(lower(split_part(new.email,'@',1)), '[^a-z0-9]+','-','g') || '-' || substr(new.id::text, 1, 4);

  insert into public.organizations (name, slug, owner_id)
    values (coalesce(split_part(new.email,'@',1), 'My workspace'), new_slug, new.id)
    returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
    values (new_org_id, new.id, 'owner');

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────
-- RAG search RPC — hybrid: cosine similarity scoped to chatbot
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.match_knowledge_chunks(
  p_chatbot_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 6,
  p_min_similarity float default 0.0
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable as $$
  select
    kc.id, kc.source_id, kc.content, kc.metadata,
    1 - (kc.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.chatbot_id = p_chatbot_id
    and kc.embedding is not null
    and 1 - (kc.embedding <=> p_query_embedding) >= p_min_similarity
  order by kc.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────────
alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.organization_members   enable row level security;
alter table public.chatbots               enable row level security;
alter table public.knowledge_sources      enable row level security;
alter table public.knowledge_chunks       enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.leads                  enable row level security;
alter table public.usage_logs             enable row level security;
alter table public.widget_events          enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.webhook_subscriptions  enable row level security;
alter table public.plans                  enable row level security;

-- Plans are public read
drop policy if exists "plans read" on public.plans;
create policy "plans read" on public.plans for select using (true);

-- Helper: is current user member of an org?
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.organization_members
    where organization_id = p_org and user_id = auth.uid()
  );
$$;

-- profiles: self read/write
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());

-- organizations: member read, owner update
drop policy if exists "orgs member select" on public.organizations;
create policy "orgs member select" on public.organizations
  for select using (public.is_org_member(id));
drop policy if exists "orgs owner update" on public.organizations;
create policy "orgs owner update" on public.organizations
  for update using (owner_id = auth.uid());

-- organization_members: member read
drop policy if exists "members read" on public.organization_members;
create policy "members read" on public.organization_members
  for select using (public.is_org_member(organization_id));

-- chatbots: member full
drop policy if exists "chatbots member all" on public.chatbots;
create policy "chatbots member all" on public.chatbots
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- knowledge_sources / chunks: member full
drop policy if exists "sources member all" on public.knowledge_sources;
create policy "sources member all" on public.knowledge_sources
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "chunks member all" on public.knowledge_chunks;
create policy "chunks member all" on public.knowledge_chunks
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- conversations / messages / leads: member read; writes go through service role
drop policy if exists "convos member read" on public.conversations;
create policy "convos member read" on public.conversations
  for select using (public.is_org_member(organization_id));

drop policy if exists "messages member read" on public.messages;
create policy "messages member read" on public.messages
  for select using (public.is_org_member(organization_id));

drop policy if exists "leads member read" on public.leads;
create policy "leads member read" on public.leads
  for select using (public.is_org_member(organization_id));

drop policy if exists "usage member read" on public.usage_logs;
create policy "usage member read" on public.usage_logs
  for select using (public.is_org_member(organization_id));

drop policy if exists "events member read" on public.widget_events;
create policy "events member read" on public.widget_events
  for select using (public.is_org_member(organization_id));

-- audit_logs / webhook_subscriptions: admin/owner only via API service role
-- (no SELECT policy intentionally — only service role reads/writes)

-- ──────────────────────────────────────────────────────────────────────────
-- Storage buckets (run via Supabase Studio or supabase CLI)
-- See: supabase storage create bucket chativo-uploads --public=false
-- ──────────────────────────────────────────────────────────────────────────
