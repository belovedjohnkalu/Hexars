import {sql} from 'kysely';
import {db} from './db';
import type {CloudScope} from '../endpoints/cloud_POST.schema';

// The existing digest index makes even very long permanent ILs a single
// indexed lookup. Compare the complete label too: a digest alone is not an ID.
export async function lookupILNodeIds(label:string,namespace:string):Promise<string[]>{
 const rows=(await sql<{nodeId:string}>`
  SELECT node_id AS "nodeId" FROM ion_cloud_identifiers
  WHERE md5(label)=md5(${label}) AND label=${label}
    AND dev_number=${namespace}::bigint
 `.execute(db)).rows;
 return rows.map(row=>row.nodeId);
}

// A node's birth IL never changes when it moves. The reverse index follows
// its current workspace; account joins restrict personal locations to the
// authenticated viewer before any cloud snapshot is loaded.
export async function indexedILScopes(ids:string[],viewerId:number|null):Promise<CloudScope[]>{
 if(!ids.length)return [];
 const viewer=viewerId??0;
 const rows=(await sql<{scope:string|null}>`
  SELECT DISTINCT COALESCE(
   shared.kind,
   CASE WHEN private_space.user_id=${viewer} THEN 'private' END,
   CASE WHEN account_space.user_id=${viewer} THEN 'accounts' END,
   CASE WHEN schedule_space.user_id=${viewer} THEN 'schedule' END
  ) AS scope
  FROM ion_cloud_locations location
  LEFT JOIN ion_shared_spaces shared ON shared.workspace_id=location.workspace_id
  LEFT JOIN ion_cloud_accounts private_space ON private_space.workspace_id=location.workspace_id
  LEFT JOIN ion_account_spaces account_space ON account_space.workspace_id=location.workspace_id
  LEFT JOIN ion_schedule_accounts schedule_space ON schedule_space.workspace_id=location.workspace_id
  WHERE location.node_id=ANY(${ids}::text[])
 `.execute(db)).rows;
 const valid=new Set<CloudScope>(['home','public','chess','private','accounts','schedule']);
 return [...new Set(rows.map(row=>row.scope).filter((scope):scope is CloudScope=>valid.has(scope as CloudScope)))];
}
