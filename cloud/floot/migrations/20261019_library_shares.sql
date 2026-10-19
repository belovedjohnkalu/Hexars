ALTER TABLE ion_game_members ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
CREATE TABLE ion_game_shares (
 id uuid PRIMARY KEY,
 game_id uuid NOT NULL REFERENCES hexchess_games(id) ON DELETE CASCADE,
 sender_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id integer REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz,
 recipient_hidden_at timestamptz
);
CREATE INDEX ion_game_shared_by ON ion_game_shares(sender_id,created_at);
CREATE INDEX ion_game_received_by ON ion_game_shares(recipient_id,created_at);
