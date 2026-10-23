-- Floot push resource supplies VAPID keys and its managed service worker.
CREATE TABLE IF NOT EXISTS ion_home_preferences (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 hidden_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ion_push_subscriptions (
 identity_hash text PRIMARY KEY,
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
 subscription jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ion_push_subscriptions_user_idx ON ion_push_subscriptions(user_id);
CREATE TABLE IF NOT EXISTS ion_notifications (
 id text PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('time-sent','time-received','shared-game')),
 source_id uuid NOT NULL, payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ion_notification_deliveries (
 notification_id text NOT NULL REFERENCES ion_notifications(id) ON DELETE CASCADE,
 identity_hash text NOT NULL REFERENCES ion_push_subscriptions(identity_hash) ON DELETE CASCADE,
 attempts integer NOT NULL DEFAULT 0, lease_until timestamptz, sent_at timestamptz, last_error text,
 PRIMARY KEY(notification_id,identity_hash)
);
-- Versioned administrative changes invalidate only their authorized scope.
CREATE TABLE IF NOT EXISTS ion_workspace_refresh (
 workspace_id uuid PRIMARY KEY REFERENCES ion_workspaces(id) ON DELETE CASCADE,
 version integer NOT NULL CHECK(version>=0)
);
