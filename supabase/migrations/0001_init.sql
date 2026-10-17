-- Strategist OS – volledig datamodel
-- Uitvoeren in Supabase → SQL Editor (of via `supabase db push`).
-- Alle tabellen hebben Row Level Security: elke gebruiker ziet alleen eigen data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Hulpfuncties
-- ---------------------------------------------------------------------------

create or replace function public.set_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profielen (1-op-1 met auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                 uuid primary key references auth.users on delete cascade,
  naam               text,
  standaard_taal     text not null default 'Nederlands',
  standaard_platform text not null default 'Meta',
  drempels           jsonb not null default '{"hook_rate": 30, "hold_rate": 10, "ctr": 1, "cpa": 30, "roas": 2}',
  tag_lijsten        jsonb not null default '{}',
  aangemaakt_op      timestamptz not null default now(),
  bijgewerkt_op      timestamptz not null default now()
);

create trigger profiles_bijgewerkt before update on public.profiles
  for each row execute function public.set_bijgewerkt_op();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, naam)
  values (new.id, coalesce(new.raw_user_meta_data->>'naam', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projecten
-- ---------------------------------------------------------------------------

create table public.projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users on delete cascade,
  naam                 text not null,
  omschrijving         text,
  prijs                text,
  url                  text,
  landingspagina_tekst text,
  doelgroep            text,
  platforms            text[] not null default '{}',
  doel                 text,
  taal                 text not null default 'Nederlands',
  concurrenten         jsonb not null default '[]',
  klantdata            text,
  drempels             jsonb not null default '{}',
  is_voorbeeld         boolean not null default false,
  aangemaakt_op        timestamptz not null default now(),
  bijgewerkt_op        timestamptz not null default now()
);

create index projects_user_idx on public.projects (user_id);
create trigger projects_bijgewerkt before update on public.projects
  for each row execute function public.set_bijgewerkt_op();

-- Controleert of het project van de ingelogde gebruiker is (voor child-tabellen).
create or replace function public.owns_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select pid is null or exists (select 1 from public.projects p where p.id = pid and p.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Onderzoek, angles, hooks, briefs
-- ---------------------------------------------------------------------------

create table public.research (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users on delete cascade,
  project_id        uuid not null unique references public.projects on delete cascade,
  pijnpunten        jsonb not null default '[]',
  verlangens        jsonb not null default '[]',
  bezwaren          jsonb not null default '[]',
  aha_momenten      jsonb not null default '[]',
  klanttaal         jsonb not null default '[]',
  bewustzijnsniveau jsonb,
  goedgekeurd       boolean not null default false,
  bijgewerkt_op     timestamptz not null default now()
);
create trigger research_bijgewerkt before update on public.research
  for each row execute function public.set_bijgewerkt_op();

create table public.angles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  project_id    uuid not null references public.projects on delete cascade,
  naam          text not null,
  type          text,
  kernboodschap text,
  doelgroep     text,
  onderbouwing  text,
  risico        text,
  score         int check (score between 1 and 10),
  geselecteerd  boolean not null default false,
  eigen         boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index angles_project_idx on public.angles (project_id);

create table public.hooks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  project_id    uuid not null references public.projects on delete cascade,
  angle_id      uuid references public.angles on delete set null,
  gesproken     text,
  overlay       text,
  eerste_shot   text,
  type          text,
  ster          boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index hooks_project_idx on public.hooks (project_id);
create index hooks_angle_idx on public.hooks (angle_id);

create table public.briefs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  project_id    uuid not null references public.projects on delete cascade,
  angle_id      uuid references public.angles on delete set null,
  hook_id       uuid references public.hooks on delete set null,
  titel         text not null default 'Naamloze brief',
  inhoud        jsonb not null default '{}',
  status        text not null default 'concept'
                check (status in ('concept', 'klaar', 'in_productie', 'live', 'gearchiveerd')),
  share_token   text unique,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index briefs_project_idx on public.briefs (project_id);
create trigger briefs_bijgewerkt before update on public.briefs
  for each row execute function public.set_bijgewerkt_op();

-- ---------------------------------------------------------------------------
-- Swipe file
-- ---------------------------------------------------------------------------

create table public.swipe_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  titel         text not null,
  merk          text,
  platform      text,
  url           text,
  media_url     text,
  transcript    text,
  tags          jsonb not null default '{}',
  "analyse"     jsonb,  -- tussen quotes: ANALYSE is een gereserveerd woord
  notities      text,
  beoordeling   int check (beoordeling between 1 and 5),
  aangemaakt_op timestamptz not null default now()
);
create index swipe_user_idx on public.swipe_items (user_id);

create table public.brief_swipe_links (
  brief_id uuid not null references public.briefs on delete cascade,
  swipe_id uuid not null references public.swipe_items on delete cascade,
  user_id  uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (brief_id, swipe_id)
);

-- ---------------------------------------------------------------------------
-- Testlog
-- ---------------------------------------------------------------------------

create table public.tests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  project_id    uuid not null references public.projects on delete cascade,
  brief_id      uuid references public.briefs on delete set null,
  naam          text not null,
  angle         text,
  hook          text,
  format        text,
  platform      text,
  live_datum    date,
  status        text not null default 'testen'
                check (status in ('testen', 'winnaar', 'verliezer', 'gestopt')),
  metrics       jsonb not null default '{}',
  hypothese     text,
  les           text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index tests_project_idx on public.tests (project_id);
create trigger tests_bijgewerkt before update on public.tests
  for each row execute function public.set_bijgewerkt_op();

-- ---------------------------------------------------------------------------
-- AI: systeemprompts en outputgeschiedenis (versies + tokenverbruik)
-- ---------------------------------------------------------------------------

create table public.prompt_templates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  functie       text not null,
  systeemprompt text not null,
  bijgewerkt_op timestamptz not null default now(),
  unique (user_id, functie)
);
create trigger prompt_templates_bijgewerkt before update on public.prompt_templates
  for each row execute function public.set_bijgewerkt_op();

create table public.ai_outputs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  project_id    uuid references public.projects on delete cascade,
  functie       text not null,
  ref_id        uuid,
  output        jsonb not null,
  model         text,
  input_tokens  int,
  output_tokens int,
  aangemaakt_op timestamptz not null default now()
);
create index ai_outputs_lookup_idx on public.ai_outputs (user_id, functie, project_id, aangemaakt_op desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.research          enable row level security;
alter table public.angles            enable row level security;
alter table public.hooks             enable row level security;
alter table public.briefs            enable row level security;
alter table public.swipe_items       enable row level security;
alter table public.brief_swipe_links enable row level security;
alter table public.tests             enable row level security;
alter table public.prompt_templates  enable row level security;
alter table public.ai_outputs        enable row level security;

create policy "eigen profiel" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "eigen projecten" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigen onderzoek" on public.research
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

create policy "eigen angles" on public.angles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

create policy "eigen hooks" on public.hooks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

create policy "eigen briefs" on public.briefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

create policy "eigen swipe items" on public.swipe_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigen koppelingen" on public.brief_swipe_links
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigen tests" on public.tests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

create policy "eigen prompts" on public.prompt_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigen ai output" on public.ai_outputs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_project(project_id));

-- ---------------------------------------------------------------------------
-- Storage: privé bucket voor screenshots/video's (map per gebruiker: <user_id>/...)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "media lezen" on storage.objects for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media uploaden" on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media wijzigen" on storage.objects for update
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media verwijderen" on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
