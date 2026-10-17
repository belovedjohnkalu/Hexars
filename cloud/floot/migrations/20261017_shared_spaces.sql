-- Applied to the active Floot database on 2026-10-17.
-- Owner user ID 1 was verified for this deployment. Do not infer owner from role.
CREATE TABLE IF NOT EXISTS ion_shared_spaces (
 kind text PRIMARY KEY CHECK (kind IN ('public','chess')),
 workspace_id uuid NOT NULL UNIQUE REFERENCES ion_workspaces(id),
 owner_user_id integer NOT NULL REFERENCES users(id)
);
WITH missing AS (
 SELECT kind,gen_random_uuid() AS id FROM (VALUES ('public'),('chess')) v(kind)
 WHERE NOT EXISTS (SELECT 1 FROM ion_shared_spaces s WHERE s.kind=v.kind)
), inserted AS (
 INSERT INTO ion_workspaces(id,access_token_hash,nodes,owner_id)
 SELECT id,repeat('0',64),'[]'::jsonb,1 FROM missing RETURNING id
)
INSERT INTO ion_shared_spaces(kind,workspace_id,owner_user_id)
 SELECT m.kind,m.id,1 FROM missing m JOIN inserted i USING(id);
CREATE TABLE IF NOT EXISTS ion_cloud_transfers (
 operation_id uuid PRIMARY KEY,
 user_id integer NOT NULL REFERENCES users(id),
 source_workspace uuid NOT NULL REFERENCES ion_workspaces(id),
 target_workspace uuid NOT NULL REFERENCES ion_workspaces(id),
 source_node text NOT NULL,
 target_parent text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('move','copy')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ion_remembered_devices (
 token_hash text PRIMARY KEY,
 expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ion_device_accounts (
 device_hash text NOT NULL REFERENCES ion_remembered_devices(token_hash) ON DELETE CASCADE,
 user_id integer NOT NULL REFERENCES users(id),
 session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
 PRIMARY KEY(device_hash,user_id)
);
ALTER TABLE hexchess_games ADD COLUMN IF NOT EXISTS difficulty smallint
 NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5);
