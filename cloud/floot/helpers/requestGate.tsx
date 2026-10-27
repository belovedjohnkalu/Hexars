import { sql, type Transaction } from 'kysely';
import { db } from './db';
import type { DB } from './schema';

// An atomic, per-account bucket; never a process-local or app-wide mutex.
export async function requestGate(key: string, limit: number, seconds: number, tx: typeof db | Transaction<DB> = db) {
  const result = await sql<{ count: number }>`
    INSERT INTO ion_request_buckets(key,opened_at,count) VALUES(${key},clock_timestamp(),1)
    ON CONFLICT(key) DO UPDATE SET
      opened_at=CASE WHEN ion_request_buckets.opened_at <= clock_timestamp()-make_interval(secs=>${seconds}) THEN clock_timestamp() ELSE ion_request_buckets.opened_at END,
      count=CASE WHEN ion_request_buckets.opened_at <= clock_timestamp()-make_interval(secs=>${seconds}) THEN 1 ELSE ion_request_buckets.count+1 END
    WHERE ion_request_buckets.opened_at <= clock_timestamp()-make_interval(secs=>${seconds}) OR ion_request_buckets.count < ${limit}
    RETURNING count
  `.execute(tx);
  if (!result.rows.length) throw Object.assign(new Error('A little too fast. Try again shortly.'), { status: 429, retryAfter: seconds });
}
