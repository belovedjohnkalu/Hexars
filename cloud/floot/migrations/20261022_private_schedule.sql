CREATE TABLE IF NOT EXISTS ion_schedule_accounts (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 workspace_id uuid UNIQUE NOT NULL REFERENCES ion_workspaces(id) ON DELETE CASCADE
);
