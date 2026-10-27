import { sql } from 'kysely';
import { db } from './db';

// Bounded housekeeping, never saved-game retention or a polling data feed.
export async function chessMaintenance() {
  await sql`DELETE FROM ion_request_buckets WHERE key IN(SELECT key FROM ion_request_buckets WHERE opened_at<clock_timestamp()-interval '2 days' LIMIT 20000)`.execute(db);
  await sql`DELETE FROM ion_online_attempts WHERE ctid IN(SELECT ctid FROM ion_online_attempts WHERE attempted_at<clock_timestamp()-interval '1 day' LIMIT 20000)`.execute(db);
  await sql`DELETE FROM sessions WHERE id IN(SELECT id FROM sessions WHERE expires_at<clock_timestamp()-interval '30 days' LIMIT 20000)`.execute(db);
}
