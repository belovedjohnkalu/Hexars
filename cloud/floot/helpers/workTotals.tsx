import { sql,type Kysely,type Transaction } from 'kysely';
import { db } from './db';
import type { DB } from './schema';
export function equalWorkShare(total:string,features:number){if(!Number.isSafeInteger(features)||features<1)throw new Error('No paid features.');const n=BigInt(features),value=BigInt(total);if(value<0n)throw new Error('Invalid work total.');return ((value+n-1n)/n).toString();}
export async function workTotals(tx:Kysely<DB>|Transaction<DB>=db){
 const row=await sql<{baselineUs:string;recordedUs:string;basis:string;updatedAt:Date}>`select c.baseline_us::text, c.basis,c.updated_at,coalesce((select sum((extract(epoch from (ended_at-started_at))*1000000)::bigint) from ion_work_sessions where ended_at is not null),0)::text as recorded_us from ion_work_config c where c.id=true`.execute(tx);
 const v=row.rows[0];if(!v)throw new Error('Work total unavailable');return {...v,totalWorkUs:(BigInt(v.baselineUs)+BigInt(v.recordedUs)).toString()};
}
