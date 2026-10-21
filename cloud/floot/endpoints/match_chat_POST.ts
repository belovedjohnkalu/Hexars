import { sql } from 'kysely';
import { publish } from '@floot/realtime';
import { db } from '../helpers/db';
import { onlineUser } from '../helpers/gameAccess';
import { runNativeEngine } from '../helpers/runNativeEngine';
import { onlineMatchState } from '../helpers/onlineMatch';
import { functionIdentifiers } from '../helpers/functionIdentifiers';
import { channels } from '../helpers/realtimeChannels';
import { schema,type ChatWord } from './match_chat_POST.schema';
function fail(message:string,status:number):never{throw Object.assign(new Error(message),{status});}
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};try{
 const user=await onlineUser(request),raw=await request.text();if(raw.length>2048)fail('Message too long.',413);
 const input=schema.parse(JSON.parse(raw));
 const row=await db.selectFrom('hexchessGames').innerJoin('ionGameMembers','ionGameMembers.gameId','hexchessGames.id').selectAll('hexchessGames').select('ionGameMembers.seat').where('hexchessGames.id','=',input.gameId).where('ionGameMembers.userId','=',user.id).executeTakeFirst();
 if(!row||row.mode!=='online'||row.seat===null)fail('This match is not available to this account.',404);
 const native=await runNativeEngine({action:'inspect',state:row.state,origin:request.url,signal:request.signal});
 if(onlineMatchState(row.onlineState).result||native.game.result.status!=='ongoing')fail('This match has ended.',409);
 await db.transaction().execute(async tx=>{
  await sql`SELECT pg_advisory_xact_lock(74210,${user.id})`.execute(tx);
  const recent=await tx.selectFrom('ionOnlineAttempts').select(sql<number>`count(*)::int`.as('count')).where('userId','=',user.id).where('attemptedAt','>',new Date(Date.now()-60000)).executeTakeFirstOrThrow();
  if(recent.count>=20)fail('Wait a moment before sending again.',429);
  await tx.insertInto('ionOnlineAttempts').values({userId:user.id}).execute();
  await tx.deleteFrom('ionOnlineAttempts').where('userId','=',user.id).where('attemptedAt','<',new Date(Date.now()-86400000)).execute();
 });
 const message:ChatWord={...input,name:user.displayName,seat:row.seat!,expiresAt:Date.now()+600000};
 const members=await db.selectFrom('ionGameMembers').select('userId').where('gameId','=',row.id).execute();
 // The text is transported only. No chat rows, workspace nodes or saved-game text.
 let ownMessage=message;
 await Promise.all(members.map(async member=>{
  const identifiers=await functionIdentifiers(member.userId,[{id:'chat-'+input.id,parentId:native.game.variant+'-board',name:'Chat',system:true}]);
  const word={...message,...(identifiers?.['chat-'+input.id]?{identifier:identifiers['chat-'+input.id]}:{})};if(member.userId===user.id)ownMessage=word;
  const delivered=await publish(channels.player(member.userId),{chat:word});if(!delivered.ok)fail('Message not sent. Try again.',503);
 }));
 return new Response(JSON.stringify({sent:true,message:ownMessage}),{headers});
 }catch(e){const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;return new Response(JSON.stringify({error:status===503?'Message not sent. Try again.':e instanceof Error?e.message:'Check your message.'}),{status,headers});}}
