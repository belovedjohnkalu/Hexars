import { db } from './db';
export async function invalidatePublicBootstrap() {
  // Revoke a refresh lease too: work that read before this mutation cannot
  // overwrite the invalidation with an old snapshot after it commits.
  await db.updateTable('ionPublicSnapshots').set({validUntil:new Date(0),leaseId:null,leaseUntil:new Date(0)}).execute();
}
