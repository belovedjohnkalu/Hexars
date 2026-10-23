import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './db';
import { workTotals } from './workTotals';
import { functionIdentifiers } from './functionIdentifiers';
import { cloudAuthorName } from './cloudAuthors';
import { workClouds } from './workClouds';
import type { Json } from './schema';
import type { TimeInput,WorkSession,WorkState } from '../endpoints/time_POST.schema';
const fail=(m:string,status=400):never=>{throw Object.assign(new Error(m),{status});};
const iso=(v:Date|string)=>new Date(v).toISOString();
export async function workSessions(input:Extract<TimeInput,{action:'work'}>,userId:number):Promise<WorkState>{
 if(!await db.selectFrom('ionDevAccounts').select('userId').where('userId','=',userId).executeTakeFirst())fail('Dev accounts only.',403);
 const owner=!!await db.selectFrom('ionSharedSpaces').select('ownerUserId').where('kind','=','home').where('ownerUserId','=',userId).executeTakeFirst();
 if(input.operation!=='list')await db.transaction().execute(async tx=>{
  if(input.operation==='baseline'){
   if(input.durationUs===undefined||!input.basis||!input.requestId||!input.expectedUpdatedAt)fail('Enter the earlier work total and its basis.');
   const config=await tx.selectFrom('ionWorkConfig').selectAll().where('id','=',true).forUpdate().executeTakeFirstOrThrow();
   const duplicate=await tx.selectFrom('ionWorkRevisions').select('id').where('id','=',input.requestId!).where('actorId','=',userId).executeTakeFirst();if(duplicate)return;
   if(iso(config.updatedAt)!==input.expectedUpdatedAt)fail('Work changed. Reload before saving.',409);
   const next={baselineUs:input.durationUs!,basis:input.basis!,updatedBy:userId,updatedAt:new Date()};
   await tx.insertInto('ionWorkRevisions').values({id:input.requestId!,actorId:userId,beforeValue:config as unknown as Json,afterValue:next as unknown as Json}).execute();
   await tx.updateTable('ionWorkConfig').set(next).where('id','=',true).execute();return;
  }
  if(!input.id)fail('Choose a session.');
  const old=await tx.selectFrom('ionWorkSessions').selectAll().where('id','=',input.id!).executeTakeFirst();
  const target=old?.devUserId??userId;if(target!==userId&&!owner)fail('Only the session’s dev can change it.',403);
  await sql`select pg_advisory_xact_lock(hashtextextended(${`ion-work:${target}`},0))`.execute(tx);
  const row=await tx.selectFrom('ionWorkSessions').selectAll().where('id','=',input.id!).forUpdate().executeTakeFirst();
  if(input.operation==='start'){
   if(row){if(row.devUserId!==userId||row.description!==(input.description||'Work session'))fail('That session ID was already used.',409);return;}
   if(await tx.selectFrom('ionWorkSessions').select('id').where('devUserId','=',userId).where('endedAt','is',null).executeTakeFirst())fail('A session is already running. Stop it first.',409);
   await tx.insertInto('ionWorkSessions').values({id:input.id!,devUserId:userId,startedAt:new Date(),description:input.description||'Work session',source:'manual'}).execute();return;
  }
  if(!row)fail('Session not found.',404);
  if(input.operation==='stop'){
   if(row!.endedAt)return;
   const endedAt=new Date();await tx.updateTable('ionWorkSessions').set({endedAt,updatedAt:endedAt}).where('id','=',row!.id).execute();return;
  }
  if(!input.startedAt||!input.endedAt||!input.expectedUpdatedAt||!input.description||!input.requestId)fail('Enter both timestamps and a description.');
  const prior=await tx.selectFrom('ionWorkRevisions').select('id').where('id','=',input.requestId!).where('actorId','=',userId).where('sessionId','=',row!.id).executeTakeFirst();if(prior)return;
  if(iso(row!.updatedAt)!==input.expectedUpdatedAt)fail('This session changed. Reload before saving.',409);
  const start=new Date(input.startedAt!),end=new Date(input.endedAt!);if(end<start||end.getTime()>Date.now())fail('Use an end after the start, no later than now.');
  const overlapping=await tx.selectFrom('ionWorkSessions').select('id').where('devUserId','=',target).where('id','!=',row!.id).where('startedAt','<',end).where(sql<boolean>`coalesce(ended_at,'infinity'::timestamptz)>${start}`).executeTakeFirst();if(overlapping)fail('This overlaps another work session.',409);
  const next={startedAt:start,endedAt:end,description:input.description!,updatedAt:new Date()};
  await tx.insertInto('ionWorkRevisions').values({id:input.requestId!,actorId:userId,sessionId:row!.id,beforeValue:row as unknown as Json,afterValue:next as unknown as Json}).execute();
  await tx.updateTable('ionWorkSessions').set(next).where('id','=',row!.id).execute();
 });
 const totals=await workTotals();
 let query=db.selectFrom('ionWorkSessions as s').innerJoin('users','users.id','s.devUserId').select(['s.id','s.devUserId','s.startedAt','s.endedAt','s.updatedAt','s.description','s.source','users.displayName']);if(input.before)query=query.where('s.startedAt','<',new Date(input.before));if(input.operation==='list'&&input.id)query=query.where('s.id','=',input.id);
 const [rows,active]=await Promise.all([query.orderBy('s.startedAt','desc').orderBy('s.id','desc').limit(101).execute(),db.selectFrom('ionWorkSessions as s').innerJoin('users','users.id','s.devUserId').select(['s.id','s.devUserId','s.startedAt','s.endedAt','s.updatedAt','s.description','s.source','users.displayName']).where('s.devUserId','=',userId).where('s.endedAt','is',null).executeTakeFirst()]);
 const view=(s:typeof rows[number]):WorkSession=>({id:s.id,description:s.description,source:s.source as 'manual'|'agent',startedAt:iso(s.startedAt),endedAt:s.endedAt?iso(s.endedAt):null,updatedAt:iso(s.updatedAt),by:cloudAuthorName(s.displayName),durationUs:s.endedAt?(BigInt(new Date(s.endedAt).getTime()-new Date(s.startedAt).getTime())*1000n).toString():'0',canEdit:s.devUserId===userId||owner});
 const result:WorkState={...totals,updatedAt:iso(totals.updatedAt),sessions:rows.slice(0,100).map(view),active:active?view(active):null,next:rows.length>100?iso(rows[99].startedAt):null};
 result.identifiers=await functionIdentifiers(userId,workClouds(result));return result;
}
