import { sql } from 'kysely';
import { db } from './db';
import { decodeIL, normalizeIL } from './cloudIL';
import { communityStore } from './communityStore';
import type { ILItem } from '../endpoints/il_POST.schema';

export async function communityIL(value:string):Promise<ILItem|null> {
  const il=decodeIL(value);if(!il)return null;
  const row=(await sql<{id:string;topicId:string;replyId:string|null;roomId:string;name:string}>`
    SELECT i.node_id AS id,t.id::text AS "topicId",NULL::text AS "replyId",t.room_id AS "roomId",t.title AS name
    FROM ion_cloud_identifiers i JOIN ion_chess_topics t ON 'chess-topic:'||t.id::text=i.node_id
    WHERE i.label=${il.label} AND i.dev_number=${il.namespace}::bigint AND t.visibility='visible'
    UNION ALL
    SELECT i.node_id,t.id::text,r.id::text,t.room_id,t.title
    FROM ion_cloud_identifiers i JOIN ion_chess_replies r ON 'chess-reply:'||r.id::text=i.node_id JOIN ion_chess_topics t ON t.id=r.topic_id
    WHERE i.label=${il.label} AND i.dev_number=${il.namespace}::bigint AND t.visibility='visible' AND r.visibility='visible' LIMIT 1
  `.execute(db)).rows[0];
  if(!row)return null;
  try{await communityStore.room(row.roomId);}catch{return null;}
  return{id:row.id,name:row.name,il:normalizeIL(value),scope:'chess',url:'/?'+new URLSearchParams({cloud:row.roomId,space:'chess',topic:row.topicId,...(row.replyId?{reply:row.replyId}:{})})};
}
