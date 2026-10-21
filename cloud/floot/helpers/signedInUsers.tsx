import { sql,type Kysely,type Transaction } from 'kysely';
import { publish } from '@floot/realtime';
import { db } from './db';
import type { DB } from './schema';
import { channels } from './realtimeChannels';
// One account counts once across devices; use precisely the pricing population.
export async function signedInUserCount(tx:Kysely<DB>|Transaction<DB>=db){
 const row=await tx.selectFrom('sessions').select(sql<number>`count(distinct user_id)::int`.as('buyers')).where('credentialExpiresAt','>',new Date()).executeTakeFirstOrThrow();
 return row.buyers;
}
export async function signedInUsersChanged(){
 try{await publish(channels.timeCatalog,{changed:true});}catch{console.error('Signed-in count refresh delayed');}
}
