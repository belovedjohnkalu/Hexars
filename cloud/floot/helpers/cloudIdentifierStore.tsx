import { sql } from 'kysely';
import { db } from './db';
import { allocateIdentifiers,type IdentifierRecord } from './cloudIdentifiers';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
// Only public/Chess and the configured owner's own Private workspace enter this
// service. Other accounts' Private content is never read or indexed here.
export async function cloudIdentifierStore(nodes:CloudNode[],devNumber=0){
 const ids=[...new Set(nodes.flatMap(n=>n.parentId?[n.id,n.parentId]:[n.id]))];
 if(!ids.length)return new Map<string,IdentifierRecord>();
 const read=async(executor:typeof db)=>{
  const result=await sql<IdentifierRecord>`SELECT node_id AS "nodeId",parent_id AS "parentId",label,arrival_ordinal::text AS "arrivalOrdinal",dev_number::text AS "devNumber" FROM ion_cloud_identifiers WHERE node_id=ANY(${ids}::text[])`.execute(executor);
  return result.rows;
 };
 const existing=await read(db);
 const knownIds=new Set(existing.map(n=>n.nodeId));
 if(nodes.every(n=>knownIds.has(n.id)))return new Map(existing.map(n=>[n.nodeId,n]));
 return db.transaction().execute(async tx=>{
  // Serialize number allocation across devices, independent of soft deletion or
  // workspace transfers. Re-read after locking; never trust a stale counter.
  await sql`SELECT pg_advisory_xact_lock(74209,11001)`.execute(tx);
  const counters=(await sql<{parentId:string;nextOrdinal:string}>`SELECT parent_id AS "parentId",next_ordinal::text AS "nextOrdinal" FROM ion_cloud_identifier_counters WHERE parent_id=ANY(${ids}::text[]) FOR UPDATE`.execute(tx)).rows;
  const lockedKnown=(await sql<IdentifierRecord>`SELECT node_id AS "nodeId",parent_id AS "parentId",label,arrival_ordinal::text AS "arrivalOrdinal",dev_number::text AS "devNumber" FROM ion_cloud_identifiers WHERE node_id=ANY(${ids}::text[])`.execute(tx)).rows;
  const allocation=allocateIdentifiers(nodes,lockedKnown,new Map(counters.map(c=>[c.parentId,Number(c.nextOrdinal)])));
  if(allocation.added.length)await tx.insertInto('ionCloudIdentifiers').values(allocation.added.map(record=>({...record,devNumber:String(devNumber)}))).execute();
  if(allocation.counters.size)await tx.insertInto('ionCloudIdentifierCounters').values([...allocation.counters].map(([parentId,next])=>({parentId,nextOrdinal:String(next)}))).onConflict(oc=>oc.column('parentId').doUpdateSet({nextOrdinal:sql`excluded.next_ordinal`})).execute();
  for(const added of allocation.added)allocation.records.set(added.nodeId,{...added,devNumber:String(devNumber)});
  return allocation.records;
 });
}
