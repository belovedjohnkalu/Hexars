CREATE TABLE IF NOT EXISTS ion_cloud_identifiers (
  node_id text PRIMARY KEY,
  parent_id text,
  label text NOT NULL,
  arrival_ordinal bigint NOT NULL CHECK (arrival_ordinal >= 0),
  assigned_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ion_cloud_identifier_counters (
  parent_id text PRIMARY KEY,
  next_ordinal bigint NOT NULL CHECK (next_ordinal >= 0)
);
INSERT INTO ion_cloud_identifiers (node_id,parent_id,label,arrival_ordinal)
VALUES ('hexagonal-chess',NULL,'IL0',0),('public',NULL,'IL1',1),('private',NULL,'IL2',2)
ON CONFLICT (node_id) DO NOTHING;

-- Index a fixed-size digest so deep identifier paths do not hit Postgres's
-- btree entry-size ceiling. Generated paths and serialized counters own identity.
CREATE UNIQUE INDEX IF NOT EXISTS ion_cloud_identifier_label_digest
ON ion_cloud_identifiers (md5(label));
ALTER TABLE ion_cloud_identifiers DROP CONSTRAINT IF EXISTS ion_cloud_identifiers_label_key;
