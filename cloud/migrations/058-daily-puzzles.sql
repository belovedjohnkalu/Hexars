-- Daily progress is private to its authenticated owner. Puzzle answers stay in
-- server-only, generated banks; no native search is started by puzzle viewers.
CREATE TABLE ion_daily_puzzle_progress (
 user_id integer NOT NULL REFERENCES users(id),
 puzzle_id text NOT NULL,
 variant text NOT NULL CHECK(variant IN('glinski','mccooey','shafran','brusky','devasa','wellisch','hexdame','kruzno')),
 day text NOT NULL CHECK(day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 solved boolean NOT NULL DEFAULT false,
 hint_used boolean NOT NULL DEFAULT false,
 solved_move jsonb,
 last_request_id uuid,
 last_request_hash text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,puzzle_id)
);
