-- Preserve every assigned label while isolating forum identities from clouds.
-- This guard prevents migration from reassigning a real workspace cloud's IL.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM ion_chess_topics t JOIN ion_chess_replies r USING(id))
 OR EXISTS(SELECT 1 FROM ion_workspaces w,jsonb_array_elements(w.nodes) n
   WHERE EXISTS(SELECT 1 FROM ion_chess_topics t WHERE n->>'id'=t.id::text)
      OR EXISTS(SELECT 1 FROM ion_chess_replies r WHERE n->>'id'=r.id::text))
 THEN RAISE EXCEPTION 'Forum identity collision needs individual label allocation';
 END IF;
END $$;
UPDATE ion_cloud_identifier_counters c SET parent_id='chess-topic:'||c.parent_id
WHERE EXISTS(SELECT 1 FROM ion_chess_topics t WHERE t.id::text=c.parent_id);
UPDATE ion_cloud_identifiers i SET parent_id='chess-topic:'||i.parent_id
WHERE EXISTS(SELECT 1 FROM ion_chess_topics t WHERE t.id::text=i.parent_id);
UPDATE ion_cloud_identifiers i SET node_id='chess-topic:'||i.node_id
WHERE EXISTS(SELECT 1 FROM ion_chess_topics t WHERE t.id::text=i.node_id);
UPDATE ion_cloud_identifiers i SET node_id='chess-reply:'||i.node_id
WHERE EXISTS(SELECT 1 FROM ion_chess_replies r WHERE r.id::text=i.node_id);
