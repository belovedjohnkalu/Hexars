import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './db';

export async function gameOperationLease(gameId: string) {
  const leaseId = randomUUID();
  const result = await sql`
    INSERT INTO ion_game_operations(game_id,lease_id,expires_at) VALUES(${gameId}::uuid,${leaseId}::uuid,clock_timestamp()+interval '45 seconds')
    ON CONFLICT(game_id) DO UPDATE SET lease_id=excluded.lease_id,expires_at=excluded.expires_at
    WHERE ion_game_operations.expires_at<=clock_timestamp() RETURNING game_id
  `.execute(db);
  if (!result.rows.length) throw Object.assign(new Error('This board is already updating. Try again shortly.'), { status: 409 });
  return async () => { await db.deleteFrom('ionGameOperations').where('gameId', '=', gameId).where('leaseId', '=', leaseId).execute(); };
}
