-- New products inherit shared equal-work pricing. Zero below is a legacy
-- publication sentinel, not a fixed price or an invented historical estimate.
-- The authoritative cost is calculated by timeLedger.catalog/workTotals.
INSERT INTO ion_time_cost_proposals(id,product_id,duration_us,basis,author_id) VALUES
 ('f5000059-0000-4000-8000-000000000001','variant:hexdame',0,'Direct request: implement HexDame. Dynamic equal-work pricing uses the shared total of closed work sessions divided by published features and signed-in accounts. No fixed historical estimate is asserted.',1),
 ('f5000059-0000-4000-8000-000000000002','variant:kruzno',0,'Direct request: implement Kruzno checkers. Dynamic equal-work pricing uses the shared total of closed work sessions divided by published features and signed-in accounts. No fixed historical estimate is asserted.',1)
ON CONFLICT(id) DO NOTHING;
INSERT INTO ion_time_products(id,kind,reference,name,direct_us,free_us,proposal_id,approved_by,published_at) VALUES
 ('variant:hexdame','variant','hexdame','HexDame',0,0,'f5000059-0000-4000-8000-000000000001',1,clock_timestamp()),
 ('variant:kruzno','variant','kruzno','Kruzno’s Checkers',0,0,'f5000059-0000-4000-8000-000000000002',1,clock_timestamp())
ON CONFLICT(id) DO NOTHING;
