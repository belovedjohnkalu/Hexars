-- ION 0.53: shared Chess navigation only. Existing node identities and content remain.
-- Run once against the inspected shared version; a changed version requires reinspection.
DO $$
DECLARE w ion_workspaces%ROWTYPE; patches jsonb := $patches$[{"id": "b72fa667-e8d3-41bc-9eda-750383255956", "parentId": "hexagonal-chess", "name": "Play"}, {"id": "d8b61dd3-a222-492d-8ccc-9dc08cf12cd2", "parentId": "hexagonal-chess", "name": "Learn"}, {"id": "boards", "parentId": "b72fa667-e8d3-41bc-9eda-750383255956", "name": "Variants"}, {"id": "engines", "parentId": "b72fa667-e8d3-41bc-9eda-750383255956", "name": "Engines", "color": "coral"}, {"id": "rules", "parentId": "d8b61dd3-a222-492d-8ccc-9dc08cf12cd2", "name": "Rules", "color": "amber"}, {"id": "6a7b29cf-c0cc-4794-82fa-3b67a4480a47", "parentId": "d8b61dd3-a222-492d-8ccc-9dc08cf12cd2", "name": "Challenges"}, {"id": "329fc2f7-1c41-46e2-b272-ab78135f9c1e", "parentId": "chess-history", "name": "Notes"}, {"id": "7ee8cf48-81a2-42d7-9cfa-8733d9c72895", "parentId": "329fc2f7-1c41-46e2-b272-ab78135f9c1e", "name": "Saved Rules"}, {"id": "bb7a5768-994d-43a8-8919-f801564e299f", "parentId": "329fc2f7-1c41-46e2-b272-ab78135f9c1e", "name": "Gliński position"}, {"id": "748a65f5-32b3-4328-bc08-0e93155f7864", "parentId": "329fc2f7-1c41-46e2-b272-ab78135f9c1e", "name": "Gliński notes"}, {"id": "online-random", "name": "Matchmaking"}, {"id": "online-lobby", "parentId": "online-random", "name": "Random", "href": "/?cloud=online-lobby&kind=find&variant=random"}, {"id": "00831025-1dd6-4ed0-919c-9becb81fe71c", "variant": "glinski"}, {"id": "cbf21fd1-8b64-409f-8881-c87f0cae7937", "variant": "mccooey"}, {"id": "162d4459-9ed2-4852-8fb2-8aa242273e3d", "variant": "shafran"}, {"id": "5ac118b4-94ee-4d3f-96d1-e50804a598bf", "variant": "brusky"}, {"id": "a5deec1c-51e3-4ab3-82f9-e2fa61595cdd", "variant": "devasa"}, {"id": "85ffe11f-8ab5-44a6-9476-72796691db3c", "variant": "wellisch"}]$patches$; next_nodes jsonb;
BEGIN
 SELECT * INTO STRICT w FROM ion_workspaces WHERE id='d88e366b-a6aa-4167-b911-de004ccea7f8' FOR UPDATE;
 IF w.version<>24 THEN RAISE EXCEPTION 'Chess workspace changed; reinspect before applying'; END IF;
 SELECT jsonb_agg(CASE WHEN p IS NULL THEN n ELSE
  (CASE WHEN n->>'id'='748a65f5-32b3-4328-bc08-0e93155f7864' THEN n-'destination' ELSE n END)||p END ORDER BY ord)
 INTO next_nodes FROM jsonb_array_elements(w.nodes) WITH ORDINALITY a(n,ord)
 LEFT JOIN LATERAL (SELECT x AS p FROM jsonb_array_elements(patches)x WHERE x->>'id'=n->>'id') b ON true;
 SELECT next_nodes||coalesce(jsonb_agg(p),'[]'::jsonb) INTO next_nodes FROM jsonb_array_elements(patches)p
 WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(w.nodes)n WHERE n->>'id'=p->>'id');
 UPDATE ion_workspaces SET nodes=next_nodes,version=w.version+1,updated_at=now() WHERE id=w.id;
 INSERT INTO ion_workspace_refresh(workspace_id,version) VALUES(w.id,w.version+1)
 ON CONFLICT(workspace_id) DO UPDATE SET version=GREATEST(ion_workspace_refresh.version,EXCLUDED.version);
END $$;
