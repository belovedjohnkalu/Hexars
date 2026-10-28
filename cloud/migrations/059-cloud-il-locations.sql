-- A permanent IL identifies a node, while its current workspace may change.
-- Keep a small reverse index in the same transaction as every workspace edit.
-- Historical identifier labels and parent IDs are never rewritten here.
CREATE TABLE IF NOT EXISTS ion_cloud_locations (
  workspace_id uuid NOT NULL REFERENCES ion_workspaces(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  PRIMARY KEY (workspace_id, node_id)
);
CREATE INDEX IF NOT EXISTS ion_cloud_locations_node_workspace
  ON ion_cloud_locations (node_id, workspace_id);

CREATE OR REPLACE FUNCTION ion_sync_cloud_locations() RETURNS trigger
LANGUAGE plpgsql AS $sync$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM ion_cloud_locations l
    WHERE l.workspace_id = NEW.id
      AND l.node_id IN (
        SELECT n->>'id' FROM jsonb_array_elements(OLD.nodes) n
        EXCEPT
        SELECT n->>'id' FROM jsonb_array_elements(NEW.nodes) n
      );
    INSERT INTO ion_cloud_locations(workspace_id, node_id)
    SELECT NEW.id, id FROM (
      SELECT n->>'id' AS id FROM jsonb_array_elements(NEW.nodes) n
      EXCEPT
      SELECT n->>'id' FROM jsonb_array_elements(OLD.nodes) n
    ) added
    WHERE id IS NOT NULL
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO ion_cloud_locations(workspace_id, node_id)
    SELECT NEW.id, n->>'id' FROM jsonb_array_elements(NEW.nodes) n
    WHERE n->>'id' IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $sync$;

DROP TRIGGER IF EXISTS ion_cloud_locations_sync ON ion_workspaces;
CREATE TRIGGER ion_cloud_locations_sync
AFTER INSERT OR UPDATE OF nodes ON ion_workspaces
FOR EACH ROW EXECUTE FUNCTION ion_sync_cloud_locations();

INSERT INTO ion_cloud_locations(workspace_id,node_id)
SELECT w.id,n->>'id' FROM ion_workspaces w
CROSS JOIN LATERAL jsonb_array_elements(w.nodes) n
WHERE n->>'id' IS NOT NULL
ON CONFLICT DO NOTHING;
