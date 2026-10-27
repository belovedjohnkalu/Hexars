import {queueTask} from '@floot/queueTask';
import {randomUUID} from 'node:crypto';
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
 const leaseId=randomUUID();
 try{const claim=await db.updateTable('ionCatalogSignal').set({leaseId,leaseUntil:new Date(Date.now()+30000)}).where('id','=',true).where('leaseUntil','<=',new Date()).returning('id').executeTakeFirst();
 if(claim)await queueTask('announceSignedInUsers',{leaseId});
 }catch{await db.updateTable('ionCatalogSignal').set({leaseId:null,leaseUntil:new Date(0)}).where('id','=',true).where('leaseId','=',leaseId).execute().catch(()=>{});console.error('Signed-in count update delayed');}
}

export async function signedInUserExpiry(){const row=await db.selectFrom('sessions').innerJoin('users','users.id','sessions.userId').select(sql<Date|null>`min(sessions.expires_at)`.as('next')).where('sessions.expiresAt','>',new Date()).where('users.email','not like','%@example.invalid').executeTakeFirstOrThrow();return row.next?new Date(row.next).toISOString():undefined;}
