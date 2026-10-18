CREATE TABLE IF NOT EXISTS ion_dev_accounts (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 granted_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ion_dev_accounts(user_id)
SELECT DISTINCT owner_user_id FROM ion_shared_spaces ON CONFLICT DO NOTHING;
ALTER TABLE ion_shared_spaces DROP CONSTRAINT IF EXISTS ion_shared_spaces_kind_check;
ALTER TABLE ion_shared_spaces ADD CONSTRAINT ion_shared_spaces_kind_check
CHECK(kind IN('public','chess','home'));
WITH inserted AS (
 INSERT INTO ion_workspaces(id,access_token_hash,nodes)
 SELECT '2835be1e-0c17-4f51-9a35-e26aac92f884',repeat('0',64),'[]'::jsonb
 WHERE NOT EXISTS(SELECT 1 FROM ion_shared_spaces WHERE kind='home') RETURNING id
)
INSERT INTO ion_shared_spaces(kind,workspace_id,owner_user_id)
SELECT 'home',id,(SELECT min(user_id) FROM ion_dev_accounts) FROM inserted;
CREATE TABLE IF NOT EXISTS ion_account_spaces (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 workspace_id uuid NOT NULL UNIQUE REFERENCES ion_workspaces(id)
);
INSERT INTO ion_cloud_identifiers(node_id,parent_id,label,arrival_ordinal)
VALUES('ion',NULL,'IL',0),('controls','ion','IL3',3),('accounts','ion','IL4',4)
ON CONFLICT DO NOTHING;
INSERT INTO ion_cloud_identifier_counters(parent_id,next_ordinal)
VALUES('ion',5) ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS hexchess_games_updated_at_idx ON hexchess_games(updated_at);
