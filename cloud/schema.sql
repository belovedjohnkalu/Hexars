-- Cloud saved-game table. This schema is already provisioned on the published app.
-- Floot generates helpers/schema.tsx from the database; do not hand-edit that file.
CREATE TABLE IF NOT EXISTS hexchess_games (
  id uuid PRIMARY KEY,
  access_token_hash text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('engine', 'two_players')),
  human_player smallint NOT NULL CHECK (human_player IN (0, 1)),
  state jsonb NOT NULL,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  moves jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 0,
  last_search jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
