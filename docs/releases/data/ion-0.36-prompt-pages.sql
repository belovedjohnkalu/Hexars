-- Add requested empty prompt pages after server privacy is deployed.
-- One transaction; serialize against normal IL allocation and preserve live edits.
DO $workflow$
DECLARE
  target_id uuid; current_nodes jsonb; parent_label text; parent_dev bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(74209,11001);
  SELECT w.id,w.nodes INTO STRICT target_id,current_nodes
  FROM ion_shared_spaces s JOIN ion_workspaces w ON w.id=s.workspace_id
  WHERE s.kind='home' AND s.owner_user_id=1 FOR UPDATE OF w;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(current_nodes) n WHERE n->>'id'='a6af91c2-fd49-49e9-a385-d911890368c9') THEN
    RETURN; -- lost-response retry; verify the resulting rows read-only afterwards
  END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_nodes) n WHERE n->>'id'='8d489e18-161c-4c8b-a7a4-63cdfecc9394' AND NOT (n ? 'removedBy')) THEN
    RAISE EXCEPTION 'Prompt branch changed; re-read before adding pages';
  END IF;
  SELECT label,dev_number INTO STRICT parent_label,parent_dev FROM ion_cloud_identifiers WHERE node_id='8d489e18-161c-4c8b-a7a4-63cdfecc9394';
  IF parent_label<>'IL90' OR parent_dev<>0 OR
     EXISTS(SELECT 1 FROM ion_cloud_identifier_counters WHERE parent_id='8d489e18-161c-4c8b-a7a4-63cdfecc9394' AND next_ordinal<>0) OR
     EXISTS(SELECT 1 FROM ion_cloud_identifiers WHERE parent_id='8d489e18-161c-4c8b-a7a4-63cdfecc9394') OR
     EXISTS(SELECT 1 FROM jsonb_array_elements(current_nodes) n WHERE n->>'parentId'='8d489e18-161c-4c8b-a7a4-63cdfecc9394') THEN
    RAISE EXCEPTION 'Prompt arrival slots changed; preserve existing identifiers and re-read';
  END IF;
  UPDATE ion_workspaces SET nodes=current_nodes || '[{"id": "a6af91c2-fd49-49e9-a385-d911890368c9", "parentId": "8d489e18-161c-4c8b-a7a4-63cdfecc9394", "name": "Prompts", "createdBy": 1, "color": "cyan"}, {"id": "55b50ec5-26d5-428b-81f2-cae577e42828", "parentId": "8d489e18-161c-4c8b-a7a4-63cdfecc9394", "name": "Completed", "createdBy": 1, "color": "mint"}, {"id": "ef9da214-6a55-4861-a609-dee2726bb486", "parentId": "a6af91c2-fd49-49e9-a385-d911890368c9", "name": "Complete", "createdBy": 1, "color": "amber"}]'::jsonb, version=version+1,updated_at=now() WHERE id=target_id;
  INSERT INTO ion_cloud_identifiers(node_id,parent_id,label,arrival_ordinal,dev_number) VALUES
    ('a6af91c2-fd49-49e9-a385-d911890368c9','8d489e18-161c-4c8b-a7a4-63cdfecc9394',parent_label||'0',0,parent_dev),
    ('55b50ec5-26d5-428b-81f2-cae577e42828','8d489e18-161c-4c8b-a7a4-63cdfecc9394',parent_label||'1',1,parent_dev),
    ('ef9da214-6a55-4861-a609-dee2726bb486','a6af91c2-fd49-49e9-a385-d911890368c9',parent_label||'00',0,parent_dev);
  INSERT INTO ion_cloud_identifier_counters(parent_id,next_ordinal) VALUES
    ('8d489e18-161c-4c8b-a7a4-63cdfecc9394',2),('a6af91c2-fd49-49e9-a385-d911890368c9',1)
  ON CONFLICT(parent_id) DO UPDATE SET next_ordinal=excluded.next_ordinal;
END $workflow$;
