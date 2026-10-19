ALTER TABLE hexchess_games ADD COLUMN IF NOT EXISTS engine_id text NOT NULL DEFAULT 'tactical';
CREATE TABLE IF NOT EXISTS ion_game_members (
 game_id uuid NOT NULL REFERENCES hexchess_games(id) ON DELETE CASCADE,
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 seat integer,
 PRIMARY KEY(game_id,user_id),
 CHECK(seat IS NULL OR seat BETWEEN 0 AND 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ion_game_seats ON ion_game_members(game_id,seat) WHERE seat IS NOT NULL;
CREATE INDEX IF NOT EXISTS ion_games_by_user ON ion_game_members(user_id,game_id);
CREATE TYPE ion_lobby_status AS ENUM ('waiting','playing','cancelled');
CREATE TABLE ion_match_lobbies (
 id uuid PRIMARY KEY, code text, variant text NOT NULL,
 host_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status ion_lobby_status NOT NULL DEFAULT 'waiting',
 game_id uuid REFERENCES hexchess_games(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 CHECK(code IS NULL OR code ~ '^[0-9]{4}$')
);
CREATE UNIQUE INDEX ion_active_room_codes ON ion_match_lobbies(code) WHERE status='waiting' AND code IS NOT NULL;
CREATE TABLE ion_lobby_members (
 lobby_id uuid NOT NULL REFERENCES ion_match_lobbies(id) ON DELETE CASCADE,
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 seat integer NOT NULL CHECK(seat BETWEEN 0 AND 2),
 PRIMARY KEY(lobby_id,user_id), UNIQUE(lobby_id,seat)
);
CREATE INDEX ion_lobby_user ON ion_lobby_members(user_id,lobby_id);
CREATE TABLE ion_online_attempts (user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, attempted_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ion_online_attempt_user ON ion_online_attempts(user_id,attempted_at);
ALTER TABLE hexchess_games DROP CONSTRAINT hexchess_games_mode_check;
ALTER TABLE hexchess_games ADD CONSTRAINT hexchess_games_mode_check CHECK (mode IN ('engine','two_players','online'));
