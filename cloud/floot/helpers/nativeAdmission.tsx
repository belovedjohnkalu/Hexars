import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './db';

// Durable leases bound active native work across ALL serverless instances.
// Slots are admission limits, not a claim about provider concurrency quotas.
export async function nativeAdmission(kind: 'search' | 'rules') {
  const lease = randomUUID();
  const admitted = await sql<{ slot: number }>`
    UPDATE ion_engine_slots SET lease_id=${lease},expires_at=clock_timestamp()+interval '40 seconds'
    WHERE (kind,slot)=(
      SELECT s.kind,s.slot FROM ion_engine_slots s CROSS JOIN ion_chess_settings c
      WHERE c.id AND s.kind=${kind} AND s.slot<=CASE WHEN ${kind}='search' THEN c.search_slots ELSE c.rules_slots END
      AND s.expires_at<=clock_timestamp() ORDER BY s.slot FOR UPDATE OF s SKIP LOCKED LIMIT 1
    ) RETURNING slot
  `.execute(db);
  if (!admitted.rows.length) throw Object.assign(new Error('The boards are busy. Try again in a moment.'), { status: 503, retryAfter: 2 });
  return async () => {
    await db.updateTable('ionEngineSlots').set({ leaseId: null, expiresAt: new Date(0) })
      .where('kind', '=', kind).where('slot', '=', admitted.rows[0].slot).where('leaseId', '=', lease).execute();
  };
}
