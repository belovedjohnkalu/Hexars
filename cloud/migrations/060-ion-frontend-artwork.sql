-- Update the existing shared clouds in place. Their IDs, ILs, descendants,
-- authors and permissions remain untouched. A concurrent custom artwork or
-- rename aborts the transaction rather than overwriting an owner's edit.
DO $ion$
DECLARE
  targets jsonb := $json$[
    {"kind":"home","id":"public","old_name":"Safari","new_name":"Hub","old_url":"/_cdn/static/73459c8d-8ae5-49db-a0c2-9d5b354c82a4.png","new_url":"/_cdn/static/22186170-92cc-4a5d-9af2-494eb6272bbc-ion-hub-transparent.png"},
    {"kind":"public","id":"public","old_name":"Safari","new_name":"Hub","old_url":"/_cdn/static/73459c8d-8ae5-49db-a0c2-9d5b354c82a4.png","new_url":"/_cdn/static/22186170-92cc-4a5d-9af2-494eb6272bbc-ion-hub-transparent.png"},
    {"kind":"home","id":"time","old_name":"Bank","new_name":"Reserve","old_url":"/_cdn/static/e7ed39bd-25a3-4b99-ba5d-6142890503f8.png","new_url":"/_cdn/static/f864addf-257e-412b-b49a-4abe66f700b9-ion-reserve-transparent.png"},
    {"kind":"home","id":"a4f2cf74-a925-40fc-a293-4fbd96e7466d","old_name":"Arcade","new_name":"Console","old_url":"/_cdn/static/8fc51a1b-0520-43ad-903e-772a75c3516b.png","new_url":"/_cdn/static/a4f0f02f-1726-45db-b130-a97be96f4ce1-ion-console-transparent.png"},
    {"kind":"home","id":"9752ef94-8ecb-4682-81df-16dfe2410616","old_url":"/_cdn/static/2d065b22-1ebe-4a98-b482-43eefa86258f.png","new_url":"/_cdn/static/7b10e41f-8468-46ca-aeca-26a0e57c3717-ion-settings-transparent.png"},
    {"kind":"home","id":"private","old_url":"/_cdn/static/358b7227-6900-4d34-9670-740e52d2062a.png","new_url":"/_cdn/static/c23935b7-3f0d-4b50-b66e-091b7cb03c53-ion-journal-transparent.png"},
    {"kind":"home","id":"controls","old_url":"/_cdn/static/ion-controls-photo.png","new_url":"/_cdn/static/75eac983-9589-4893-b186-d1769e9bb10f-ion-controls-transparent.png"},
    {"kind":"home","id":"home-hidden-features","old_url":"/_cdn/static/2c886140-4c63-44b4-843c-1d0805914663.png","new_url":"/_cdn/static/ac831181-4d44-42ff-873b-612ed6b72241-ion-hidden-transparent.png"},
    {"kind":"home","id":"6208875d-c43c-4548-824f-9c0229fd16bc","old_url":"/_cdn/static/d5effbe7-11bb-4b50-bfa1-30049408d5e6.png","new_url":"/_cdn/static/365d4fe1-dabf-4a9b-8fa4-24d612716922-ion-prompts-transparent.png"},
    {"kind":"home","id":"b23120d8-6452-4e58-8b01-456174d44437","old_url":"/_cdn/static/d9c5c4ce-1b8d-4d81-b8b2-0a3f4cf06716.png","new_url":"/_cdn/static/c57c2070-6b19-4421-8b0f-9a9e2abe4a94-ion-schedule-transparent.png"},
    {"kind":"home","id":"hexagonal-chess","old_url":"/_cdn/static/73922d54-c2d3-47e7-952e-07f83fbe44e7.png","new_url":"/_cdn/static/30263651-96cf-448a-a691-ec99bfbe0bf4-ion-boardgames-transparent.png"},
    {"kind":"chess","id":"hexagonal-chess","old_url":"/_cdn/static/73922d54-c2d3-47e7-952e-07f83fbe44e7.png","new_url":"/_cdn/static/30263651-96cf-448a-a691-ec99bfbe0bf4-ion-boardgames-transparent.png"}
  ]$json$::jsonb;
  row_data record;
  target record;
  updated_nodes jsonb;
  next_version integer;
  spaces_seen integer := 0;
BEGIN
  FOR row_data IN
    SELECT s.kind,w.id,w.nodes FROM ion_shared_spaces s
    JOIN ion_workspaces w ON w.id=s.workspace_id
    WHERE s.kind IN ('home','public','chess') ORDER BY w.id FOR UPDATE OF w
  LOOP
    spaces_seen := spaces_seen + 1;
    FOR target IN SELECT * FROM jsonb_to_recordset(targets)
      AS t(kind text,id text,old_name text,new_name text,old_url text,new_url text)
      WHERE kind=row_data.kind
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(row_data.nodes) n
        WHERE n->>'id'=target.id AND n->>'removedBy' IS NULL
          AND n->>'imageUrl' IN (target.old_url,target.new_url)
          AND (target.new_name IS NULL OR n->>'name' IN (target.old_name,target.new_name))
      ) THEN RAISE EXCEPTION 'Cloud changed before artwork update: % / %',row_data.kind,target.id;
      END IF;
    END LOOP;
    SELECT jsonb_agg(
      CASE WHEN t.id IS NULL THEN n.value
        ELSE n.value || jsonb_build_object('imageUrl',t.new_url)
          || CASE WHEN t.new_name IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('name',t.new_name) END
      END ORDER BY n.ordinality
    ) INTO updated_nodes
    FROM jsonb_array_elements(row_data.nodes) WITH ORDINALITY n(value,ordinality)
    LEFT JOIN jsonb_to_recordset(targets) AS t(kind text,id text,old_name text,new_name text,old_url text,new_url text)
      ON t.kind=row_data.kind AND t.id=n.value->>'id';
    IF updated_nodes IS DISTINCT FROM row_data.nodes THEN
      UPDATE ion_workspaces SET nodes=updated_nodes,version=version+1,updated_at=clock_timestamp()
        WHERE id=row_data.id RETURNING version INTO next_version;
      INSERT INTO ion_workspace_refresh(workspace_id,version) VALUES(row_data.id,next_version)
        ON CONFLICT(workspace_id) DO UPDATE
          SET version=GREATEST(ion_workspace_refresh.version,EXCLUDED.version);
    END IF;
  END LOOP;
  IF spaces_seen<>3 THEN RAISE EXCEPTION 'Shared cloud workspaces are unavailable'; END IF;
  UPDATE ion_public_snapshots SET valid_until=to_timestamp(0),lease_id=NULL,lease_until=to_timestamp(0);
END $ion$;
