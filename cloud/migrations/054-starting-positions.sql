-- Immutable native-validated positions, shared across serverless instances.
CREATE TABLE ion_starting_positions (
  variant text NOT NULL,
  build_code text NOT NULL,
  state jsonb NOT NULL,
  view jsonb NOT NULL,
  engine text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(variant,build_code)
);
