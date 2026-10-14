begin;

create table public.hexars_games (
  id uuid primary key,
  owner_id uuid references auth.users(id) on delete set null,
  access_token_hash text not null check (access_token_hash ~ '^[a-f0-9]{64}$'),
  mode text not null check (mode in ('engine', 'two_players')),
  human_player smallint not null check (human_player in (0, 1)),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  timeline jsonb not null default '[]'::jsonb check (jsonb_typeof(timeline) = 'array'),
  moves jsonb not null default '[]'::jsonb check (jsonb_typeof(moves) = 'array'),
  version integer not null default 0 check (version >= 0),
  last_search jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hexars_games_owner_updated on public.hexars_games(owner_id, updated_at desc);

alter table public.hexars_games enable row level security;
revoke all on public.hexars_games from anon, authenticated;
grant select on public.hexars_games to authenticated;
grant all on public.hexars_games to service_role;
create policy "Owners can read their games" on public.hexars_games
  for select to authenticated using ((select auth.uid()) = owner_id);

-- Browsers have no INSERT/UPDATE/DELETE policy or grant. The API uses a secret
-- key and the C++ rules engine to validate every state change.
comment on table public.hexars_games is 'C++ validated games; mutations only through the HEXARS API';
commit;
