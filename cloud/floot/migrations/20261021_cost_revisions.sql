CREATE TABLE IF NOT EXISTS ion_time_cost_revisions (
 id uuid PRIMARY KEY, product_id text NOT NULL,
 proposal_id uuid NOT NULL REFERENCES ion_time_cost_proposals(id),
 actor_id integer NOT NULL REFERENCES users(id),
 before_cost jsonb NOT NULL, after_cost jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS ion_time_cost_revisions_product ON ion_time_cost_revisions(product_id,created_at DESC);
DROP TRIGGER IF EXISTS ion_time_cost_revisions_immutable ON ion_time_cost_revisions;
CREATE TRIGGER ion_time_cost_revisions_immutable BEFORE UPDATE OR DELETE ON ion_time_cost_revisions FOR EACH ROW EXECUTE FUNCTION ion_time_immutable();
