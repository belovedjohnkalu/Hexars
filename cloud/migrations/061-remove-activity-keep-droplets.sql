-- Remove only the shared Activity wrapper. Permanent cloud identities and
-- ledger data remain intact; normal restore can reverse this soft deletion.
DO $ion$
DECLARE
  home_row record;
  activity jsonb;
  defaults jsonb := '[{"id":"time-added","parentId":"time-activity","name":"Added","system":true,"color":"mint","href":"/?cloud=time-added&space=home"},{"id":"time-spent","parentId":"time-activity","name":"Spent","system":true,"color":"coral","href":"/?cloud=time-spent&space=home"},{"id":"time-remaining","parentId":"time-activity","name":"Balance","system":true,"color":"amber","href":"/?cloud=time-remaining&space=home"}]'::jsonb;
  default_node jsonb;
  next_nodes jsonb;
  operation_id text := '25d7c239-12f7-4e9a-b514-e7d08b77c94d';
BEGIN
  SELECT w.id,w.nodes,w.version INTO STRICT home_row
    FROM ion_shared_spaces s JOIN ion_workspaces w ON w.id=s.workspace_id
    WHERE s.kind='home' FOR UPDATE OF w;
  SELECT n.value INTO activity FROM jsonb_array_elements(home_row.nodes) n(value)
    WHERE n.value->>'id'='time-activity';
  IF activity IS NULL OR activity->>'parentId'<>'time' THEN
    RAISE EXCEPTION 'Expected Activity inside Reserve';
  END IF;
  IF activity->>'removedBy' IS NOT NULL THEN RETURN; END IF;
  next_nodes := home_row.nodes;
  -- Materialize untouched functional seeds before changing their parent.
  FOR default_node IN SELECT value FROM jsonb_array_elements(defaults) LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(next_nodes) n(value)
      WHERE n.value->>'id'=default_node->>'id') THEN
      next_nodes := next_nodes || jsonb_build_array(default_node);
    END IF;
  END LOOP;
  SELECT jsonb_agg(CASE
    WHEN n.value->>'id'='time-activity' THEN n.value || jsonb_build_object(
      'removedBy',operation_id,'removedAt',clock_timestamp())
    WHEN n.value->>'parentId'='time-activity' AND n.value->>'removedBy' IS NULL THEN
      n.value || jsonb_build_object('parentId',activity->>'parentId',
        'promotedBy',operation_id,'promotedFrom','time-activity')
    ELSE n.value END ORDER BY n.ordinality) INTO next_nodes
    FROM jsonb_array_elements(next_nodes) WITH ORDINALITY n(value,ordinality);
  UPDATE ion_workspaces SET nodes=next_nodes,version=version+1,updated_at=clock_timestamp()
    WHERE id=home_row.id;
  INSERT INTO ion_workspace_refresh(workspace_id,version) VALUES(home_row.id,home_row.version+1)
    ON CONFLICT(workspace_id) DO UPDATE
      SET version=GREATEST(ion_workspace_refresh.version,EXCLUDED.version);
  UPDATE ion_public_snapshots SET valid_until=to_timestamp(0),lease_id=NULL,lease_until=to_timestamp(0);
END $ion$;
