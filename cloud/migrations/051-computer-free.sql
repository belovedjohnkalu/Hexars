-- Computer (all six difficulties) and HexDame are free. Retire only catalog
-- publication; preserve proposal, entitlement and append-only purchase records.
UPDATE ion_time_products SET published_at=NULL
WHERE kind='engine' OR id='variant:hexdame';
-- Never charge an obsolete quote for something that is now free.
UPDATE ion_time_quotes SET expires_at=least(expires_at,clock_timestamp())
WHERE kind='purchase' AND used_transaction_id IS NULL
AND (product_id LIKE 'engine:%' OR product_id='variant:hexdame');
