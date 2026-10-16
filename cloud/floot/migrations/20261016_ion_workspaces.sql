-- Already applied to the active Floot database on 2026-10-16.
-- Workspace access is checked by cloud_POST through a hashed random capability.
CREATE TABLE IF NOT EXISTS ion_workspaces (
  id uuid PRIMARY KEY,
  access_token_hash text NOT NULL,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(nodes) = 'array'),
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
