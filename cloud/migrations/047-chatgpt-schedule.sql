-- Applied to the existing Floot Postgres; no new database or account system.
ALTER TABLE ion_time_products DROP CONSTRAINT ion_time_products_kind_check;
ALTER TABLE ion_time_products ADD CONSTRAINT ion_time_products_kind_check CHECK(kind IN ('variant','engine','feature'));
INSERT INTO ion_time_products(id,kind,reference,name) VALUES('feature:schedule','feature','schedule','Schedule') ON CONFLICT(id) DO NOTHING;
-- Leave direct_us/free_us/proposal_id/published_at null: the dev supplies the estimate.
CREATE TABLE IF NOT EXISTS ion_plugin_clients(id text PRIMARY KEY,redirect_uris jsonb NOT NULL,name text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ion_plugin_codes(hash text PRIMARY KEY,client_id text NOT NULL REFERENCES ion_plugin_clients(id),user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,redirect_uri text NOT NULL,challenge text NOT NULL,scope text NOT NULL,resource text NOT NULL,expires_at timestamptz NOT NULL,consumed_at timestamptz);
CREATE TABLE IF NOT EXISTS ion_plugin_tokens(hash text PRIMARY KEY,client_id text NOT NULL REFERENCES ion_plugin_clients(id),user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,scope text NOT NULL,resource text NOT NULL,expires_at timestamptz NOT NULL,refresh_hash text UNIQUE NOT NULL,refresh_expires_at timestamptz NOT NULL,revoked_at timestamptz);
CREATE INDEX IF NOT EXISTS ion_plugin_tokens_user_idx ON ion_plugin_tokens(user_id);
