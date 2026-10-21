ALTER TABLE hexchess_games ADD COLUMN IF NOT EXISTS online_state jsonb NOT NULL DEFAULT '{}'::jsonb;
