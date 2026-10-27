import { db } from './db';
import { timeLedger, type TimeDB } from './timeLedger';

// Gameplay needs purchase proof, not global revenue, prices, work history or
// the count of every signed-in account. Keep the complete financial checks in
// the canonical purchase query and the registered-dev table.
async function read(userId:number|null,tx:TimeDB=db) {
  if(!userId)return{dev:false,owned:[] as string[]};
  const [dev,owned]=await Promise.all([
    tx.selectFrom('ionDevAccounts').select('userId').where('userId','=',userId).executeTakeFirst(),
    timeLedger.purchases(tx,userId).execute(),
  ]);
  return{dev:!!dev,owned:owned.map(p=>p.productId)};
}
export const timeEntitlements={read};
