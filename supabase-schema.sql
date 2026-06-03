-- Run this in your Supabase SQL Editor

create table public.rss_sources (
  id         uuid primary key default gen_random_uuid(),
  url        text not null unique,
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.drafts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  content        text not null,
  source_url     text,
  source_feed_id uuid references public.rss_sources(id) on delete set null,
  status         text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  content      text not null,
  draft_id     uuid references public.drafts(id) on delete set null,
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on edits
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger drafts_updated_at before update on public.drafts
  for each row execute procedure public.set_updated_at();

create trigger articles_updated_at before update on public.articles
  for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.rss_sources enable row level security;
alter table public.drafts       enable row level security;
alter table public.articles     enable row level security;

-- Authenticated readers can read published articles
create policy "readers select articles"
  on public.articles for select to authenticated using (true);

-- Admin API routes use the service_role key which bypasses RLS entirely.
-- No additional policies needed for drafts or rss_sources.
