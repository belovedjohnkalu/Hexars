-- Time: exact microseconds, balanced append-only journal, account-specific wallets.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credential_expires_at timestamptz;
CREATE INDEX IF NOT EXISTS ion_time_live_sessions ON sessions (credential_expires_at,user_id);
CREATE TABLE IF NOT EXISTS ion_time_config (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), production_started_at timestamptz,
 free_proposal_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ion_time_config(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS ion_time_accounts (
 id text PRIMARY KEY, user_id integer UNIQUE REFERENCES users(id),
 kind text NOT NULL CHECK(kind IN ('user','treasury','issuance')),
 balance_us bigint NOT NULL DEFAULT 0,
 CHECK ((kind='user' AND user_id IS NOT NULL AND id='user:'||user_id::text) OR (kind<>'user' AND user_id IS NULL AND id=kind)),
 CHECK (kind='issuance' OR balance_us>=0)
);
INSERT INTO ion_time_accounts(id,kind) VALUES('issuance','issuance'),('treasury','treasury') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS ion_time_transactions (
 id uuid PRIMARY KEY, actor_id integer NOT NULL REFERENCES users(id), request_key text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('earn','transfer','purchase','payout','correction')),
 from_account text NOT NULL REFERENCES ion_time_accounts(id), to_account text NOT NULL REFERENCES ion_time_accounts(id),
 amount_us bigint NOT NULL CHECK(amount_us>=0), metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(from_account<>to_account), UNIQUE(actor_id,request_key)
);
CREATE INDEX IF NOT EXISTS ion_time_transactions_from ON ion_time_transactions(from_account,created_at DESC,id);
CREATE INDEX IF NOT EXISTS ion_time_transactions_to ON ion_time_transactions(to_account,created_at DESC,id);
CREATE TABLE IF NOT EXISTS ion_time_entries (
 transaction_id uuid NOT NULL REFERENCES ion_time_transactions(id), account_id text NOT NULL REFERENCES ion_time_accounts(id),
 amount_us bigint NOT NULL, PRIMARY KEY(transaction_id,account_id)
);
CREATE TABLE IF NOT EXISTS ion_time_cost_proposals (
 id uuid PRIMARY KEY, product_id text NOT NULL, duration_us bigint NOT NULL CHECK(duration_us>=0),
 basis text NOT NULL CHECK(length(btrim(basis)) BETWEEN 1 AND 4000),
 author_id integer NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS ion_time_products (
 id text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('variant','engine')), reference text NOT NULL,
 name text NOT NULL, direct_us bigint CHECK(direct_us>=0), free_us bigint CHECK(free_us>=0),
 proposal_id uuid REFERENCES ion_time_cost_proposals(id), approved_by integer REFERENCES users(id), published_at timestamptz,
 UNIQUE(kind,reference), CHECK ((published_at IS NULL) OR (direct_us IS NOT NULL AND free_us IS NOT NULL AND proposal_id IS NOT NULL AND approved_by IS NOT NULL))
);
INSERT INTO ion_time_products(id,kind,reference,name) VALUES
 ('variant:mccooey','variant','mccooey','McCooey'),('variant:shafran','variant','shafran','Shafran'),
 ('variant:brusky','variant','brusky','Brusky'),('variant:devasa','variant','devasa','De Vasa'),('variant:wellisch','variant','wellisch','Wellisch'),
 ('engine:tactical','engine','tactical','Tactical'),('engine:positional','engine','positional','Positional'),
 ('engine:defensive','engine','defensive','Defensive'),('engine:materialist','engine','materialist','Materialist'),('engine:unconventional','engine','unconventional','Unconventional')
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS ion_time_quotes (
 id uuid PRIMARY KEY, actor_id integer NOT NULL REFERENCES users(id),
 kind text NOT NULL CHECK(kind IN ('purchase','transfer','payout')), product_id text REFERENCES ion_time_products(id),
 recipient_id integer REFERENCES users(id), amount_us bigint NOT NULL CHECK(amount_us>=0), buyers integer,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
 used_transaction_id uuid REFERENCES ion_time_transactions(id),
 CHECK((kind='purchase' AND product_id IS NOT NULL AND recipient_id IS NULL AND buyers>0) OR (kind IN ('transfer','payout') AND product_id IS NULL AND recipient_id IS NOT NULL AND amount_us>0))
);
CREATE TABLE IF NOT EXISTS ion_time_entitlements (
 user_id integer NOT NULL REFERENCES users(id), product_id text NOT NULL REFERENCES ion_time_products(id),
 transaction_id uuid NOT NULL UNIQUE REFERENCES ion_time_transactions(id), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(user_id,product_id)
);
CREATE TABLE IF NOT EXISTS ion_time_earning (
 user_id integer PRIMARY KEY REFERENCES users(id), lease_id uuid NOT NULL, session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
 sequence bigint NOT NULL DEFAULT 0, last_seen timestamptz NOT NULL, idle_until timestamptz NOT NULL,
 active boolean NOT NULL DEFAULT true
);
-- Database journal invariants also protect future callers of the ledger.
CREATE OR REPLACE FUNCTION ion_time_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Time journal records are immutable'; END $$;
DROP TRIGGER IF EXISTS ion_time_transactions_immutable ON ion_time_transactions;
CREATE TRIGGER ion_time_transactions_immutable BEFORE UPDATE OR DELETE ON ion_time_transactions FOR EACH ROW EXECUTE FUNCTION ion_time_immutable();
DROP TRIGGER IF EXISTS ion_time_entries_immutable ON ion_time_entries;
CREATE TRIGGER ion_time_entries_immutable BEFORE UPDATE OR DELETE ON ion_time_entries FOR EACH ROW EXECUTE FUNCTION ion_time_immutable();
CREATE OR REPLACE FUNCTION ion_time_check_journal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ion_time_transactions; n integer; net numeric; debit numeric; credit numeric;
BEGIN
 SELECT * INTO STRICT t FROM ion_time_transactions WHERE id=NEW.id;
 SELECT count(*),coalesce(sum(amount_us),0),coalesce(sum(amount_us) FILTER(WHERE account_id=t.from_account),0),coalesce(sum(amount_us) FILTER(WHERE account_id=t.to_account),0)
 INTO n,net,debit,credit FROM ion_time_entries WHERE transaction_id=t.id;
 IF n<>2 OR net<>0 OR debit<>-t.amount_us OR credit<>t.amount_us THEN RAISE EXCEPTION 'Unbalanced Time transaction'; END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS ion_time_balanced ON ion_time_transactions;
CREATE CONSTRAINT TRIGGER ion_time_balanced AFTER INSERT ON ion_time_transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ion_time_check_journal();
CREATE OR REPLACE FUNCTION ion_time_post(p_id uuid,p_actor integer,p_key text,p_kind text,p_from text,p_to text,p_amount bigint,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE existing ion_time_transactions; original ion_time_transactions; available bigint;
BEGIN
 IF p_amount<0 OR p_from=p_to OR length(p_key)>200 THEN RAISE EXCEPTION 'Invalid Time transaction'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('time-request:'||p_actor||':'||p_key,0));
 IF p_kind='correction' THEN
  SELECT * INTO original FROM ion_time_transactions WHERE id=(p_metadata->>'reverses')::uuid;
  IF NOT FOUND OR original.kind='correction' OR p_from<>original.to_account OR p_to<>original.from_account OR p_amount<>original.amount_us THEN RAISE EXCEPTION 'Invalid Time reversal'; END IF;
  IF original.kind='purchase' THEN p_metadata=p_metadata||jsonb_build_object('productId',original.metadata->>'productId'); END IF;
 END IF;
 SELECT * INTO existing FROM ion_time_transactions WHERE actor_id=p_actor AND request_key=p_key;
 IF FOUND THEN
  IF existing.kind<>p_kind OR existing.from_account<>p_from OR existing.to_account<>p_to OR existing.amount_us<>p_amount OR existing.metadata<>p_metadata THEN RAISE EXCEPTION 'Request key already used'; END IF;
  RETURN existing.id;
 END IF;
 PERFORM id FROM ion_time_accounts WHERE id IN(p_from,p_to) ORDER BY id FOR UPDATE;
 IF (SELECT count(*) FROM ion_time_accounts WHERE id IN(p_from,p_to))<>2 THEN RAISE EXCEPTION 'Time account unavailable'; END IF;
 SELECT balance_us INTO available FROM ion_time_accounts WHERE id=p_from;
 IF p_from<>'issuance' AND available<p_amount THEN RAISE EXCEPTION 'Not enough Time' USING ERRCODE='P0001'; END IF;
 INSERT INTO ion_time_transactions(id,actor_id,request_key,kind,from_account,to_account,amount_us,metadata) VALUES(p_id,p_actor,p_key,p_kind,p_from,p_to,p_amount,p_metadata);
 INSERT INTO ion_time_entries(transaction_id,account_id,amount_us) VALUES(p_id,p_from,-p_amount),(p_id,p_to,p_amount);
 UPDATE ion_time_accounts SET balance_us=balance_us-p_amount WHERE id=p_from;
 UPDATE ion_time_accounts SET balance_us=balance_us+p_amount WHERE id=p_to;
 RETURN p_id;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ion_time_reversed_once ON ion_time_transactions ((metadata->>'reverses')) WHERE kind='correction';
CREATE OR REPLACE FUNCTION ion_time_check_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ion_time_transactions; n integer; net numeric; debit numeric; credit numeric;
BEGIN
 SELECT * INTO STRICT t FROM ion_time_transactions WHERE id=NEW.transaction_id;
 SELECT count(*),coalesce(sum(amount_us),0),coalesce(sum(amount_us) FILTER(WHERE account_id=t.from_account),0),coalesce(sum(amount_us) FILTER(WHERE account_id=t.to_account),0) INTO n,net,debit,credit FROM ion_time_entries WHERE transaction_id=t.id;
 IF n<>2 OR net<>0 OR debit<>-t.amount_us OR credit<>t.amount_us THEN RAISE EXCEPTION 'Unbalanced Time entries'; END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS ion_time_entries_balanced ON ion_time_entries;
CREATE CONSTRAINT TRIGGER ion_time_entries_balanced AFTER INSERT ON ion_time_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ion_time_check_entry();
CREATE INDEX IF NOT EXISTS ion_time_entries_account ON ion_time_entries(account_id,transaction_id);
ALTER TABLE ion_time_accounts ADD COLUMN IF NOT EXISTS closed_at timestamptz;

ALTER TABLE ion_time_quotes ADD COLUMN IF NOT EXISTS calculation jsonb NOT NULL DEFAULT '{}'::jsonb;
