-- ION 0.69. Additive only: retain every existing game, IL, account and ledger.
ALTER TABLE hexchess_games ADD COLUMN IF NOT EXISTS cached_view jsonb;
ALTER TABLE hexchess_games ADD COLUMN IF NOT EXISTS view_code text;

CREATE TYPE ion_chess_visibility AS ENUM ('visible','hidden','deleted');
CREATE TYPE ion_chess_report_reason AS ENUM ('spam','abuse','unsafe','other');
CREATE TABLE ion_chess_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  community_enabled boolean NOT NULL DEFAULT true,
  slow_seconds integer NOT NULL DEFAULT 5 CHECK(slow_seconds BETWEEN 2 AND 120),
  search_slots integer NOT NULL DEFAULT 32 CHECK(search_slots BETWEEN 1 AND 128),
  rules_slots integer NOT NULL DEFAULT 128 CHECK(rules_slots BETWEEN 1 AND 256),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by integer REFERENCES users(id)
);
INSERT INTO ion_chess_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE ion_chess_topics (
  id uuid PRIMARY KEY,
  room_id text NOT NULL,
  author_user_id integer NOT NULL REFERENCES users(id),
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 240),
  body text NOT NULL CHECK(length(body) BETWEEN 1 AND 12000),
  visibility ion_chess_visibility NOT NULL DEFAULT 'visible',
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  reply_characters bigint NOT NULL DEFAULT 0 CHECK(reply_characters >= 0),
  reply_count integer NOT NULL DEFAULT 0 CHECK(reply_count >= 0),
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ion_chess_topics_feed ON ion_chess_topics(room_id,pinned DESC,created_at DESC,id DESC) WHERE visibility='visible';
CREATE INDEX ion_chess_topics_author ON ion_chess_topics(author_user_id,created_at DESC);
CREATE TABLE ion_chess_replies (
  id uuid PRIMARY KEY,
  topic_id uuid NOT NULL REFERENCES ion_chess_topics(id),
  author_user_id integer NOT NULL REFERENCES users(id),
  body text NOT NULL CHECK(length(body) BETWEEN 1 AND 12000),
  visibility ion_chess_visibility NOT NULL DEFAULT 'visible',
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ion_chess_replies_page ON ion_chess_replies(topic_id,created_at,id) WHERE visibility='visible';
CREATE TABLE ion_chess_follows (
  user_id integer NOT NULL REFERENCES users(id),
  topic_id uuid NOT NULL REFERENCES ion_chess_topics(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,topic_id)
);
CREATE TABLE ion_chess_reports (
  id uuid PRIMARY KEY,
  topic_id uuid NOT NULL REFERENCES ion_chess_topics(id),
  reply_id uuid REFERENCES ion_chess_replies(id),
  reporter_user_id integer NOT NULL REFERENCES users(id),
  reason ion_chess_report_reason NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by integer REFERENCES users(id)
);
CREATE UNIQUE INDEX ion_chess_report_once ON ion_chess_reports(reporter_user_id,topic_id,coalesce(reply_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX ion_chess_reports_open ON ion_chess_reports(created_at,id) WHERE resolved_at IS NULL;
CREATE TABLE ion_request_buckets (
  key text PRIMARY KEY,
  opened_at timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);
CREATE INDEX ion_request_buckets_expiry ON ion_request_buckets(opened_at);
CREATE TABLE ion_engine_slots (
  kind text NOT NULL CHECK(kind IN ('search','rules')),
  slot integer NOT NULL,
  lease_id uuid,
  expires_at timestamptz NOT NULL DEFAULT '-infinity',
  PRIMARY KEY(kind,slot)
);
INSERT INTO ion_engine_slots(kind,slot) SELECT 'search',generate_series(1,128);
INSERT INTO ion_engine_slots(kind,slot) SELECT 'rules',generate_series(1,256);
CREATE TABLE ion_game_operations (
  game_id uuid PRIMARY KEY REFERENCES hexchess_games(id),
  lease_id uuid NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX ion_lobbies_pool ON ion_match_lobbies(variant,created_at,id) WHERE status='waiting' AND code IS NULL;
CREATE INDEX ion_lobbies_expiry ON ion_match_lobbies(expires_at) WHERE status='waiting';
CREATE INDEX IF NOT EXISTS ion_lobby_user ON ion_lobby_members(user_id,lobby_id);
