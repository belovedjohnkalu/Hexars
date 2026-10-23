import { sql,type Kysely,type Transaction } from 'kysely';
import { publish } from '@floot/realtime';
import { db } from './db';
import type { DB } from './schema';
import { channels } from './realtimeChannels';
// A real account counts once across devices, including an unexpired saved sign-in.
// Reserved example.invalid accounts are QA fixtures, never buyers.
export async function signedInUserCount(tx:Kysely<DB>|Transaction<DB>=db){
 const row=await tx.selectFrom('sessions').innerJoin('users','users.id','sessions.userId').select(sql<number>`count(distinct sessions.user_id)::int`.as('buyers')).where('sessions.expiresAt','>',new Date()).where('users.email','not like','%@example.invalid').executeTakeFirstOrThrow();
 return row.buyers;
}
export async function signedInUsersChanged(){
 try{await publish(channels.timeCatalog,{changed:true});}catch{console.error('Signed-in count refresh delayed');}
}
