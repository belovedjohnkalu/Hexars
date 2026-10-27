import { sql, type Transaction } from 'kysely';
import { db } from './db';
import type { DB } from './schema';
import { communityId } from './chessHubClouds';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
async function read(userId:number|null) {
  const [rooms,following]=await Promise.all([
    sql<{roomId:string;characters:string}>`SELECT room_id AS "roomId",sum(characters)::text AS characters FROM ion_chess_room_sizes GROUP BY room_id`.execute(db),
    userId?sql<{characters:string}>`SELECT coalesce(sum(char_length(t.title)+char_length(t.body)+t.reply_characters),0)::text AS characters FROM ion_chess_follows f JOIN ion_chess_topics t ON t.id=f.topic_id WHERE f.user_id=${userId} AND t.visibility='visible'`.execute(db):Promise.resolve({rows:[{characters:'0'}]}),
  ]);
  return new Map([...rooms.rows.map(r=>[r.roomId,Number(r.characters)] as const),['chess-following',Number(following.rows[0]?.characters||0)] as const]);
}
async function change(tx:Transaction<DB>,topicId:string,deltas:Record<string,number>) {
  const shard=parseInt(topicId.slice(0,2),16)%64;
  // Stable ordering also prevents opposite moderator moves from deadlocking.
  for(const roomId of Object.keys(deltas).sort()){
    const amount=deltas[roomId];if(!amount)continue;
    await sql`INSERT INTO ion_chess_room_sizes(room_id,shard,characters) VALUES(${roomId},${shard},greatest(0,${amount}::bigint)) ON CONFLICT(room_id,shard) DO UPDATE SET characters=greatest(0,ion_chess_room_sizes.characters+${amount}::bigint)`.execute(tx);
  }
}
function apply(nodes:CloudNode[],counts:Map<string,number>) {
  return nodes.map(n=>n.parentId===communityId&&counts.has(n.id)?{...n,sizeCharacters:counts.get(n.id)}:n);
}
export const communitySizing={read,change,apply};
