import {communityIdentity} from './communityIdentity';
import {communitySizing} from './communitySizing';
import {communityRestore} from './communityRestore';
import {playerName} from './playerName';
import { sql, type Transaction } from 'kysely';
import { publish } from '@floot/realtime';
import { db } from './db';
import type { DB } from './schema';
import { requestGate } from './requestGate';
import { communityPaging } from './communityPaging';
import { chessHubId, communityId, communityRooms } from './chessHubClouds';
import { identifierSegment, namespaceIdentifier } from './cloudIdentifiers';
import { channels } from './realtimeChannels';
import type { CommunityInput, CommunityResult, CommunityTopic, CommunityReply } from '../endpoints/community_POST.schema';

type Executor = typeof db | Transaction<DB>;
type TopicRow = { id:string; roomId:string; title:string; body:string|null; authorId:number; name:string; createdAt:Date|string; version:number; replies:number; characters:number; pinned:boolean; locked:boolean; visibility:CommunityTopic['visibility']; label:string|null; devNumber:string|null };
type ReplyRow = { id:string; topicId:string; body:string; authorId:number; name:string; createdAt:Date|string; version:number; visibility:CommunityReply['visibility']; label:string|null; devNumber:string|null };
function fail(message:string,status=400):never { throw Object.assign(new Error(message),{status}); }
const topicColumns = sql` t.id,t.room_id AS "roomId",t.title,t.author_user_id AS "authorId",u.display_name AS name,to_char(t.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",t.version,t.reply_count AS replies,t.reply_characters::float8 AS characters,t.pinned,t.locked,t.visibility,i.label,i.dev_number::text AS "devNumber" `;
const replyColumns = sql` r.id,r.topic_id AS "topicId",r.body,r.author_user_id AS "authorId",u.display_name AS name,to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",r.version,r.visibility,i.label,i.dev_number::text AS "devNumber" `;
const topicDTO = (r:TopicRow):CommunityTopic => ({id:r.id,roomId:r.roomId,title:r.title,...(r.body!==null?{body:r.body}:{}),author:{id:r.authorId,name:playerName(r.name)},createdAt:typeof r.createdAt==='string'?r.createdAt:new Date(r.createdAt).toISOString(),version:r.version,replies:r.replies,characters:r.characters,pinned:r.pinned,locked:r.locked,visibility:r.visibility,...(r.label?{il:namespaceIdentifier(r.label,Number(r.devNumber??0))}:{})});
const replyDTO = (r:ReplyRow):CommunityReply => ({id:r.id,topicId:r.topicId,body:r.body,author:{id:r.authorId,name:playerName(r.name)},createdAt:typeof r.createdAt==='string'?r.createdAt:new Date(r.createdAt).toISOString(),version:r.version,visibility:r.visibility,...(r.label?{il:namespaceIdentifier(r.label,Number(r.devNumber??0))}:{})});

async function room(id:string,tx:Executor=db) {
  if(['chess-settings','chess-guidelines','chess-following'].includes(id))fail('Choose a discussion area.',404);
  const w=await tx.selectFrom('ionSharedSpaces').innerJoin('ionWorkspaces','ionWorkspaces.id','ionSharedSpaces.workspaceId').select('nodes').where('kind','=','chess').executeTakeFirstOrThrow();
  const nodes=Array.isArray(w.nodes)?w.nodes as Array<{id:string;parentId?:string;removedBy?:string}>:[];
  const configured=nodes.find(n=>n.id===id);
  if(nodes.find(n=>n.id===communityId)?.removedBy || configured?.removedBy || configured && configured.parentId!==communityId || !configured&&!communityRooms.includes(id as typeof communityRooms[number])) fail('This discussion area is not available.',404);
  return id;
}

async function identifier(id:string,parentId:string,tx:Transaction<DB>) {
  const existing=await tx.selectFrom('ionCloudIdentifiers').selectAll().where('nodeId','=',id).executeTakeFirst();
  if(existing)return;
  // Seed/area creation coordinates with the existing workspace allocator.
  // Normal topic/reply arrivals never take this rare setup lock.
  if(parentId===communityId||id===communityId)await sql`SELECT pg_advisory_xact_lock(74209,11001)`.execute(tx);
  // Each arrival uses only its own parent counter. A popular room never blocks
  // another room, game, personal cloud or account's IL allocation.
  await sql`SELECT pg_advisory_xact_lock(74212,hashtext(${id}))`.execute(tx);
  if(await tx.selectFrom('ionCloudIdentifiers').select('nodeId').where('nodeId','=',id).executeTakeFirst())return;
  if(parentId===communityId)await identifier(communityId,chessHubId,tx);
  const parent=await tx.selectFrom('ionCloudIdentifiers').select(['label','devNumber']).where('nodeId','=',parentId).executeTakeFirst();
  if(!parent)fail('Discussion identifiers are opening. Try again.',503);
  const next=(await sql<{ordinal:string}>`INSERT INTO ion_cloud_identifier_counters(parent_id,next_ordinal) VALUES(${parentId},1) ON CONFLICT(parent_id) DO UPDATE SET next_ordinal=ion_cloud_identifier_counters.next_ordinal+1 RETURNING (next_ordinal-1)::text AS ordinal`.execute(tx)).rows[0];
  await tx.insertInto('ionCloudIdentifiers').values({nodeId:id,parentId,label:parent.label+identifierSegment(Number(next.ordinal)),arrivalOrdinal:next.ordinal,devNumber:parent.devNumber}).execute();
}

async function topic(id:string,tx:Executor=db,includeHidden=false,lock=false) {
  const r=(await sql<TopicRow>`SELECT ${topicColumns},t.body FROM ion_chess_topics t JOIN users u ON u.id=t.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-topic:'||t.id::text WHERE t.id=${id}::uuid AND (${includeHidden} OR t.visibility='visible') ${lock?sql`FOR UPDATE OF t`:sql``}`.execute(tx)).rows[0];
  if(!r)fail('This discussion isn’t available.',404);
  return topicDTO(r);
}

async function feed(roomId:string|undefined,cursor:string|undefined,userId?:number):Promise<CommunityResult> {
  if(roomId)await room(roomId);
  const after=communityPaging.decode(cursor);
  const rows=(await sql<TopicRow>`SELECT ${topicColumns},NULL::text AS body FROM ion_chess_topics t JOIN users u ON u.id=t.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-topic:'||t.id::text
    WHERE t.visibility='visible' ${roomId?sql`AND t.room_id=${roomId}`:sql`AND EXISTS(SELECT 1 FROM ion_chess_follows f WHERE f.topic_id=t.id AND f.user_id=${userId!})`}
    ${after?sql`AND (t.pinned,t.created_at,t.id)<(${!!after.pinned},${after.date}::timestamptz,${after.id}::uuid)`:sql``}
    ORDER BY t.pinned DESC,t.created_at DESC,t.id DESC LIMIT 6`.execute(db)).rows;
  const page=rows.slice(0,5).map(topicDTO),last=page[page.length-1];
  return{topics:page,next:rows.length>5&&last?communityPaging.encode({date:last.createdAt,id:last.id,pinned:last.pinned}):null};
}

async function thread(id:string,cursor?:string,replyId?:string):Promise<CommunityResult> {
  const t=await topic(id);await room(t.roomId);
  const after=communityPaging.decode(cursor);
  const rows=(await sql<ReplyRow>`SELECT ${replyColumns} FROM ion_chess_replies r JOIN users u ON u.id=r.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-reply:'||r.id::text WHERE r.topic_id=${id}::uuid AND r.visibility='visible' ${replyId?sql`AND r.id=${replyId}::uuid`:sql``} ${after?sql`AND(r.created_at,r.id)>(${after.date}::timestamptz,${after.id}::uuid)`:sql``} ORDER BY r.created_at,r.id LIMIT 5`.execute(db)).rows;
  const replies=rows.slice(0,4).map(replyDTO),last=replies[replies.length-1];
  return{topic:t,replies,next:rows.length>4&&last?communityPaging.encode({date:last.createdAt,id:last.id}):null};
}

async function write(input:CommunityInput,userId:number):Promise<CommunityResult> {
  const dev=!!await db.selectFrom('ionDevAccounts').select('userId').where('userId','=',userId).executeTakeFirst();
  const moderator=['settings','configure','reports','resolve','moderate','inspect','insights'].includes(input.action);
  if(moderator&&!dev)fail('Only dev accounts can manage Community.',403);
  if(input.action==='inspect'){const t=await topic(input.topicId,db,true);const r=input.replyId?(await sql<ReplyRow>`SELECT ${replyColumns} FROM ion_chess_replies r JOIN users u ON u.id=r.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-reply:'||r.id::text WHERE r.id=${input.replyId}::uuid AND r.topic_id=${t.id}::uuid`.execute(db)).rows[0]:undefined;return{topic:t,...(r?{replies:[replyDTO(r)]}:{})};}
  if(input.action==='following')return feed(undefined,input.cursor,userId);
  if(input.action==='insights'){
    const row=(await sql<{playersToday:number;eligible:number;returned:number}>`
      SELECT (SELECT count(*)::int FROM ion_chess_players p JOIN users u ON u.id=p.user_id WHERE p.last_day=(now() AT TIME ZONE 'UTC')::date AND u.email NOT LIKE '%@example.invalid') AS "playersToday",
      count(*)::int AS eligible,count(*) FILTER(WHERE p.returned_7d)::int AS returned
      FROM ion_chess_players p JOIN users u ON u.id=p.user_id WHERE p.first_day BETWEEN (now() AT TIME ZONE 'UTC')::date-37 AND (now() AT TIME ZONE 'UTC')::date-7 AND u.email NOT LIKE '%@example.invalid'

    `.execute(db)).rows[0];return{insights:{...row,returnRate:row.eligible?row.returned/row.eligible:null}};
  }
  if(input.action==='settings')return{settings:await db.selectFrom('ionChessSettings').select(['communityEnabled','slowSeconds','searchSlots','rulesSlots']).where('id','=',true).executeTakeFirstOrThrow()};
  if(input.action==='configure'){
    const {action,...settings}=input;
    await db.updateTable('ionChessSettings').set({...settings,updatedAt:new Date(),updatedBy:userId}).where('id','=',true).execute();
    return{settings};
  }
  if(input.action==='reports'){
    const reports=await db.selectFrom('ionChessReports as r').innerJoin('ionChessTopics as t','t.id','r.topicId').select(['r.id','r.topicId','r.replyId','t.title','r.reason','r.createdAt']).where('r.resolvedAt','is',null).orderBy('r.createdAt').limit(20).execute();
    return{reports:reports.map(r=>({...r,createdAt:typeof r.createdAt==='string'?r.createdAt:new Date(r.createdAt).toISOString()}))};
  }
  if(input.action==='resolve'){await db.updateTable('ionChessReports').set({resolvedAt:new Date(),resolvedBy:userId}).where('id','=',input.id).where('resolvedAt','is',null).execute();return{ok:true};}
  let movedFrom:string|undefined;
  let event:{kind?:'topic'|'reply';stats?:{replies:number;characters:number};topic?:CommunityTopic;reply?:CommunityReply;removed?:string}|undefined,roomId:string|undefined;
  const result=await db.transaction().execute(async (tx:Transaction<DB>):Promise<CommunityResult>=>{
    if(input.action==='topic'){
      await sql`SELECT pg_advisory_xact_lock(74213,hashtext(${input.id}))`.execute(tx);
      const duplicate=await tx.selectFrom('ionChessTopics').select(['id','authorUserId']).where('id','=',input.id).executeTakeFirst();
      if(duplicate){if(duplicate.authorUserId!==userId)fail('Choose a new discussion.',409);return{topic:await topic(input.id,tx)};}
      await room(input.roomId,tx);
      const settings=await tx.selectFrom('ionChessSettings').select(['communityEnabled','slowSeconds']).where('id','=',true).executeTakeFirstOrThrow();
      if(!settings.communityEnabled&&!dev)fail('New discussions are paused.',403);
      await requestGate('chess-write:'+userId,1,settings.slowSeconds,tx);await requestGate('chess-topic:'+userId,6,60,tx);
      await tx.insertInto('ionChessTopics').values({id:input.id,roomId:input.roomId,authorUserId:userId,title:input.title,body:input.body}).execute();
      await communitySizing.change(tx,input.id,{[input.roomId]:Array.from(input.title).length+Array.from(input.body).length});
      await identifier(input.roomId,communityId,tx);await identifier(communityIdentity.topic(input.id),input.roomId,tx);
      await tx.insertInto('ionChessFollows').values({userId,topicId:input.id}).execute();
      const t=await topic(input.id,tx);event={topic:{...t,body:undefined}};roomId=t.roomId;return{topic:t};
    }
    if(input.action==='restore')await communityRestore.verify(input.undoToken,userId,{topicId:input.topicId,...(input.replyId?{replyId:input.replyId}:{}),version:input.version});
    const t=await topic(input.topicId,tx,dev||input.action==='restore',['reply','edit','remove','restore','moderate'].includes(input.action));
    await room(t.roomId,tx);roomId=t.roomId;
    if(input.action==='watch')return{following:!!await tx.selectFrom('ionChessFollows').select('topicId').where('userId','=',userId).where('topicId','=',t.id).executeTakeFirst()};
    if(input.action==='follow'){
      if(input.value)await tx.insertInto('ionChessFollows').values({userId,topicId:t.id}).onConflict(oc=>oc.doNothing()).execute();
      else await tx.deleteFrom('ionChessFollows').where('userId','=',userId).where('topicId','=',t.id).execute();
      return{following:input.value};
    }
    if(input.action==='report'){
      if(input.replyId&&!await tx.selectFrom('ionChessReplies').select('id').where('id','=',input.replyId).where('topicId','=',t.id).where('visibility','=','visible').executeTakeFirst())fail('This reply isn’t available.',404);
      const duplicate=await tx.selectFrom('ionChessReports').select('id').where('reporterUserId','=',userId).where('topicId','=',t.id).where('replyId',input.replyId?'=':'is',input.replyId??null).executeTakeFirst();
      if(!duplicate){await requestGate('chess-report:'+userId,10,60,tx);await tx.insertInto('ionChessReports').values({id:input.id,topicId:t.id,replyId:input.replyId??null,reporterUserId:userId,reason:input.reason}).onConflict(oc=>oc.doNothing()).execute();}
      return{ok:true};
    }
    if(input.action==='reply'){
      await sql`SELECT pg_advisory_xact_lock(74213,hashtext(${input.id}))`.execute(tx);
      const duplicate=await tx.selectFrom('ionChessReplies').select(['id','authorUserId','topicId']).where('id','=',input.id).executeTakeFirst();
      if(duplicate){if(duplicate.authorUserId!==userId||duplicate.topicId!==t.id)fail('Choose a new reply.',409);return{topic:t};}
      const settings=await tx.selectFrom('ionChessSettings').select(['communityEnabled','slowSeconds']).where('id','=',true).executeTakeFirstOrThrow();
      if((t.locked||!settings.communityEnabled)&&!dev)fail('This discussion is closed for replies.',403);
      await requestGate('chess-write:'+userId,1,settings.slowSeconds,tx);await requestGate('chess-reply:'+userId,20,60,tx);
      // Lock the topic before inserting, so a concurrent moderator's close wins.
      const locked=await tx.selectFrom('ionChessTopics').select(['locked','visibility']).where('id','=',t.id).forUpdate().executeTakeFirstOrThrow();
      if((locked.locked||locked.visibility!=='visible')&&!dev)fail('This discussion is closed for replies.',403);
      await tx.insertInto('ionChessReplies').values({id:input.id,topicId:t.id,authorUserId:userId,body:input.body}).execute();await identifier(communityIdentity.reply(input.id),communityIdentity.topic(t.id),tx);
      const stats=(await sql<{replies:number;characters:number}>`UPDATE ion_chess_topics SET reply_count=reply_count+1,reply_characters=reply_characters+char_length(${input.body}),updated_at=clock_timestamp() WHERE id=${t.id}::uuid RETURNING reply_count AS replies,reply_characters::float8 AS characters`.execute(tx)).rows[0];
      await tx.insertInto('ionChessFollows').values({userId,topicId:t.id}).onConflict(oc=>oc.doNothing()).execute();
      const row=(await sql<ReplyRow>`SELECT ${replyColumns} FROM ion_chess_replies r JOIN users u ON u.id=r.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-reply:'||r.id::text WHERE r.id=${input.id}::uuid`.execute(tx)).rows[0];
      if(t.visibility==='visible')await communitySizing.change(tx,t.id,{[t.roomId]:Array.from(input.body).length});
      const reply=replyDTO(row);event=t.visibility==='visible'?{kind:'reply',reply,stats}:{kind:'reply',removed:reply.id};return{reply,topic:{...t,...stats}};
    }
    const replyId=input.replyId;
    const r=replyId?await tx.selectFrom('ionChessReplies').selectAll().where('id','=',replyId).where('topicId','=',t.id).executeTakeFirst():undefined;
    if(replyId&&!r)fail('This reply isn’t available.',404);
    if(!dev&&(r?r.authorUserId:t.author.id)!==userId)fail('Only its author or a dev can change this post.',403);
    if((r?.version??t.version)!==input.version)fail('This post changed. Open it again.',409);
    if(input.action==='restore'&&replyId&&t.visibility!=='visible')fail('This discussion isn’t available.',404);
    if(input.action==='restore'&&(r?.visibility??t.visibility)!=='deleted')fail('This post has changed.',409);
    const visibility=input.action==='remove'?'deleted':input.action==='restore'?'visible':input.action==='moderate'?input.visibility:undefined;
    if(input.action==='moderate'&&input.roomId)await room(input.roomId,tx);
    if(r){
      const updated=await tx.updateTable('ionChessReplies').set({...(input.action==='edit'?{body:input.body}:{}),...(visibility?{visibility}:{}),version:r.version+1,updatedAt:new Date()}).where('id','=',r.id).where('version','=',r.version).returning('id').executeTakeFirst();if(!updated)fail('This reply changed. Open it again.',409);
      const before=r.visibility==='visible'?Array.from(r.body).length:0,after=(visibility??r.visibility)==='visible'?Array.from(input.action==='edit'?input.body:r.body).length:0;
      let stats={replies:t.replies,characters:t.characters};
      if(before!==after||visibility&&(r.visibility==='visible')!==(visibility==='visible'))stats=(await sql<{replies:number;characters:number}>`UPDATE ion_chess_topics SET reply_characters=greatest(0,reply_characters+${after-before}),reply_count=greatest(0,reply_count+${visibility&&(r.visibility==='visible')!==(visibility==='visible')?(visibility==='visible'?1:-1):0}) WHERE id=${t.id}::uuid RETURNING reply_count AS replies,reply_characters::float8 AS characters`.execute(tx)).rows[0];
      if(t.visibility==='visible'&&before!==after)await communitySizing.change(tx,t.id,{[t.roomId]:after-before});
      if((visibility??r.visibility)!=='visible'||t.visibility!=='visible')event={kind:'reply',removed:r.id,...(t.visibility==='visible'?{stats}:{})};
      else{const row=(await sql<ReplyRow>`SELECT ${replyColumns} FROM ion_chess_replies r JOIN users u ON u.id=r.author_user_id LEFT JOIN ion_cloud_identifiers i ON i.node_id='chess-reply:'||r.id::text WHERE r.id=${r.id}::uuid`.execute(tx)).rows[0];event={kind:'reply',reply:replyDTO(row),stats};}
    }else{
      const updated=await tx.updateTable('ionChessTopics').set({...(input.action==='edit'?{body:input.body,...(input.title?{title:input.title}:{})}:{}),...(visibility?{visibility}:{}),...(input.action==='moderate'?{...(input.pinned!==undefined?{pinned:input.pinned}:{}),...(input.locked!==undefined?{locked:input.locked}:{}),...(input.roomId?{roomId:input.roomId}:{})}:{}),version:t.version+1,updatedAt:new Date()}).where('id','=',t.id).where('version','=',t.version).returning('id').executeTakeFirst();if(!updated)fail('This discussion changed. Open it again.',409);
      const latest=await topic(t.id,tx,true),before=t.visibility==='visible'?Array.from(t.title).length+Array.from(t.body||'').length+t.characters:0,after=latest.visibility==='visible'?Array.from(latest.title).length+Array.from(latest.body||'').length+latest.characters:0;
      await communitySizing.change(tx,t.id,t.roomId===latest.roomId?{[t.roomId]:after-before}:{[t.roomId]:-before,[latest.roomId]:after});
      event=latest.visibility==='visible'?{topic:latest}:{removed:t.id};
      if(input.action==='moderate'&&input.roomId&&input.roomId!==t.roomId){movedFrom=t.roomId;roomId=input.roomId;}
    }
    return{ok:true,...(event?.stats?{topic:{...t,...event.stats}}:{}),...(input.action==='remove'?{undo:await communityRestore.issue(userId,{topicId:t.id,...(replyId?{replyId}:{}),version:input.version+1})}:{}),...(event?.reply?{reply:event.reply}:{}),...(event?.topic?{topic:event.topic}:{})};
  });
  if(event){
    const topicId='topicId'in input?input.topicId:input.action==='topic'?input.id:'';
    try{
      await publish(channels.chessTopic(topicId),event);
      if(movedFrom)await publish(channels.chessRoom(movedFrom),{removed:topicId});
      // A reply updates only its open discussion, never a global million-viewer feed.
      if(event.kind!=='reply'&&roomId)await publish(channels.chessRoom(roomId),{...event,...(event.topic?{topic:{...event.topic,body:undefined}}:{})});
    }catch{console.error('Community update delayed; reconnect will reconcile.');}
  }
  return result;
}
export const communityStore={feed,thread,write,room};
