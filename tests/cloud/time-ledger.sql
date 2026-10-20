-- Run after the Time migration on a test database, or with Floot execute_sql.
-- Every fixture rolls back inside the DO block. Journal triggers stay enabled.
DO $$
DECLARE a integer; b integer; issue uuid:=gen_random_uuid(); payment uuid:=gen_random_uuid();
 again uuid; blocked boolean; fixture text:=gen_random_uuid()::text;
BEGIN
 BEGIN
  INSERT INTO users(email,display_name,role) VALUES('time-sql-a-'||fixture||'@example.invalid','Time SQL A '||fixture,'user') RETURNING id INTO a;
  INSERT INTO users(email,display_name,role) VALUES('time-sql-b-'||fixture||'@example.invalid','Time SQL B '||fixture,'user') RETURNING id INTO b;
  INSERT INTO ion_time_accounts(id,user_id,kind) VALUES('user:'||a,a,'user'),('user:'||b,b,'user');
  PERFORM ion_time_post(issue,a,'sql-issue','earn','issuance','user:'||a,2000000,'{}');
  PERFORM ion_time_post(payment,a,'sql-transfer','transfer','user:'||a,'user:'||b,1000000,'{}');
  again:=ion_time_post(gen_random_uuid(),a,'sql-transfer','transfer','user:'||a,'user:'||b,1000000,'{}');
  IF again<>payment THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
  IF (SELECT balance_us FROM ion_time_accounts WHERE id='user:'||a)<>1000000 OR (SELECT balance_us FROM ion_time_accounts WHERE id='user:'||b)<>1000000 THEN RAISE EXCEPTION 'Transfer balances incorrect'; END IF;
  SET CONSTRAINTS ion_time_balanced,ion_time_entries_balanced IMMEDIATE;
  SET CONSTRAINTS ion_time_balanced,ion_time_entries_balanced DEFERRED;
  blocked:=false;
  BEGIN
   PERFORM ion_time_post(gen_random_uuid(),a,'sql-overspend','transfer','user:'||a,'user:'||b,1000001,'{}');
  EXCEPTION WHEN OTHERS THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Overspend accepted'; END IF;
  blocked:=false;
  BEGIN UPDATE ion_time_entries SET amount_us=1 WHERE transaction_id=payment;
  EXCEPTION WHEN OTHERS THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Journal mutation accepted'; END IF;
  blocked:=false;
  BEGIN
   INSERT INTO ion_time_entries(transaction_id,account_id,amount_us) VALUES(payment,'issuance',0);
   SET CONSTRAINTS ion_time_entries_balanced IMMEDIATE;
  EXCEPTION WHEN OTHERS THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Late third entry accepted'; END IF;
  SET CONSTRAINTS ion_time_entries_balanced DEFERRED;
  PERFORM ion_time_post(gen_random_uuid(),a,'sql-reverse-transfer','correction','user:'||b,'user:'||a,1000000,jsonb_build_object('reverses',payment));
  blocked:=false;
  BEGIN
   PERFORM ion_time_post(gen_random_uuid(),a,'sql-reverse-again','correction','user:'||b,'user:'||a,1000000,jsonb_build_object('reverses',payment));
  EXCEPTION WHEN OTHERS THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Duplicate reversal accepted'; END IF;
  PERFORM ion_time_post(gen_random_uuid(),a,'sql-reverse-earning','correction','user:'||a,'issuance',2000000,jsonb_build_object('reverses',issue));
  IF EXISTS(SELECT 1 FROM ion_time_accounts WHERE user_id IN(a,b) AND balance_us<>0) THEN RAISE EXCEPTION 'Reversals did not restore balances'; END IF;
  SET CONSTRAINTS ion_time_balanced,ion_time_entries_balanced IMMEDIATE;
  RAISE EXCEPTION 'ION_TIME_TEST_SUCCESS_ROLLBACK';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'ION_TIME_TEST_SUCCESS_ROLLBACK' THEN RAISE; END IF;
 END;
 RAISE NOTICE 'Time journal invariants passed; all fixtures rolled back.';
END $$;
