-- Applied 2026-10-17. Existing levels 1–5 and default 3 are preserved.
ALTER TABLE hexchess_games DROP CONSTRAINT IF EXISTS hexchess_games_difficulty_check;
ALTER TABLE hexchess_games ADD CONSTRAINT hexchess_games_difficulty_check
 CHECK (difficulty BETWEEN 0 AND 5);
-- Cloud colors are stored as validated palette keys in existing nodes JSON.
-- Capacity is checked atomically against versioned writes by cloudCapacity.
