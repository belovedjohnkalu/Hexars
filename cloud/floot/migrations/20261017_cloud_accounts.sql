-- Applied after Floot auth provisioning created the standard users/sessions tables.
ALTER TABLE ion_workspaces ADD COLUMN IF NOT EXISTS owner_id integer REFERENCES users(id);
CREATE TABLE IF NOT EXISTS ion_cloud_accounts (
  user_id integer PRIMARY KEY REFERENCES users(id),
  workspace_id uuid NOT NULL UNIQUE REFERENCES ion_workspaces(id)
);
