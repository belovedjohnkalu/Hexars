import { timeAccess } from '../helpers/timeAccess';
import { randomUUID,randomBytes,randomInt,createHash } from 'node:crypto';
import { sql } from 'kysely';
import { publish } from '@floot/realtime';
import { db } from '../helpers/db';
import { onlineUser } from '../helpers/gameAccess';
import { runNativeEngine } from '../helpers/runNativeEngine';
import { chessVariants } from '../helpers/chessVariants';
import { channels } from '../helpers/realtimeChannels';
import { schema,type Lobby } from './online_POST.schema';
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'no-store'};try{
 const user=await onlineUser(request),input=schema.parse(await request.json());
 const notifyPrevious=new Set<number>();
 const result=await db.transaction().execute(async tx=>{
  const owned=await timeAccess.variants(user.id,tx),family=(input.action==='find'||input.action==='create')?(input.variant!=='random'?(chessVariants.isCheckers(input.variant)?'checkers':'chess'):input.family):undefined;
  const available=owned.filter(v=>family==='checkers'?chessVariants.isCheckers(v):!chessVariants.isCheckers(v));
  if((input.action==='find'||input.action==='create')&&input.variant==='random'&&!available.length)fail('Unlock a variant in this family to play.',402);
  if((input.action==='find'||input.action==='create')&&input.variant!=='random')await timeAccess.assert(user.id,input.variant,undefined,tx);
  // One short lock serializes joining, code allocation and matchmaking. Native
  // setup has no search, and all seats/game creation commit atomically.
  await sql`SELECT pg_advisory_xact_lock(74209,19001)`.execute(tx);
  await tx.updateTable('ionMatchLobbies').set({status:'cancelled'}).where('status','=','waiting').where('expiresAt','<',new Date()).execute();
  const recent=await tx.selectFrom('ionOnlineAttempts').select(sql<number>`count(*)::int`.as('count')).where('userId','=',user.id).where('attemptedAt','>',new Date(Date.now()-60000)).executeTakeFirstOrThrow();
  if(input.action!=='get'&&recent.count>=20)fail('Too many attempts. Try again in a minute.',429);
  if(input.action!=='get')await tx.insertInto('ionOnlineAttempts').values({userId:user.id}).execute();
  await tx.deleteFrom('ionOnlineAttempts').where('attemptedAt','<',new Date(Date.now()-86400000)).execute();
  let lobby;
  if(input.action==='get'||input.action==='cancel'){
   const member=await tx.selectFrom('ionLobbyMembers').select('lobbyId').where('lobbyId','=',input.id).where('userId','=',user.id).executeTakeFirst();if(!member)fail('This room is not available to this account.',404);
   lobby=await tx.selectFrom('ionMatchLobbies').selectAll().where('id','=',input.id).executeTakeFirstOrThrow();
   if(input.action==='cancel'&&lobby.status==='waiting'){
    await tx.deleteFrom('ionLobbyMembers').where('lobbyId','=',lobby.id).where('userId','=',user.id).execute();
    if(lobby.hostUserId===user.id)await tx.updateTable('ionMatchLobbies').set({status:'cancelled'}).where('id','=',lobby.id).execute();
   }
  }else{
   const existing=await tx.selectFrom('ionMatchLobbies').innerJoin('ionLobbyMembers','ionLobbyMembers.lobbyId','ionMatchLobbies.id').selectAll('ionMatchLobbies').where('ionLobbyMembers.userId','=',user.id).where('status','=','waiting').executeTakeFirst();
   if(existing){
    const compatible=input.action==='join'?existing.code===input.code:(input.action==='create'?existing.code!==null:existing.code===null)&&(input.variant==='random'?available.includes(existing.variant):existing.variant===input.variant);
    if(compatible)lobby=existing;
    else{const oldMembers=await tx.selectFrom('ionLobbyMembers').select('userId').where('lobbyId','=',existing.id).execute();oldMembers.forEach(m=>notifyPrevious.add(m.userId));await tx.deleteFrom('ionLobbyMembers').where('lobbyId','=',existing.id).where('userId','=',user.id).execute();if(existing.hostUserId===user.id)await tx.updateTable('ionMatchLobbies').set({status:'cancelled'}).where('id','=',existing.id).execute();}
   }
   if(!lobby&&input.action==='join'){
    lobby=await tx.selectFrom('ionMatchLobbies').selectAll().where('code','=',input.code).where('status','=','waiting').executeTakeFirst();if(!lobby)fail('No open room with that code.',404);
   }else if(!lobby&&input.action==='find'){
    let query=tx.selectFrom('ionMatchLobbies').selectAll().where('code','is',null).where('status','=','waiting').where('hostUserId','!=',user.id).where('variant','in',available).orderBy('createdAt');
    if(input.variant!=='random')query=query.where('variant','=',input.variant);
    lobby=await query.executeTakeFirst();
   }
   if(!lobby){
    if(input.action==='join')fail('No open room with that code.',404);
    let code:string|null=null;if(input.action==='create'){for(let n=0;n<100;n++){const candidate=String(randomInt(10000)).padStart(4,'0');if(!await tx.selectFrom('ionMatchLobbies').select('id').where('code','=',candidate).where('status','=','waiting').executeTakeFirst()){code=candidate;break;}}if(!code)fail('All rooms are busy. Try again.',503);}
    const variant=input.variant==='random'?available[randomInt(available.length)]:input.variant;
    lobby=await tx.insertInto('ionMatchLobbies').values({id:randomUUID(),hostUserId:user.id,code,variant}).returningAll().executeTakeFirstOrThrow();
   }
   await timeAccess.assert(user.id,lobby.variant,undefined,tx);
  const members=await tx.selectFrom('ionLobbyMembers').selectAll().where('lobbyId','=',lobby.id).execute();
   if(!members.some(m=>m.userId===user.id)){
    const seat=[0,1,2].find(n=>!members.some(m=>m.seat===n));if(seat===undefined||seat>=(lobby.variant==='wellisch'?3:2))fail('This room is full.',409);
    await tx.insertInto('ionLobbyMembers').values({lobbyId:lobby.id,userId:user.id,seat}).execute();
   }
  }
  if(!lobby)fail('Room unavailable.',404);
  const members=await tx.selectFrom('ionLobbyMembers').innerJoin('users','users.id','ionLobbyMembers.userId').select(['userId','seat','users.displayName as name']).where('lobbyId','=',lobby.id).orderBy('seat').execute(),needed=lobby.variant==='wellisch'?3:2;
  if(lobby.status==='waiting'&&input.action!=='cancel'&&members.length===needed){
   const native=await runNativeEngine({action:'new',variant:chessVariants.all.find(v=>v.id===lobby!.variant)!.id,origin:request.url});
   const gameId=randomUUID();await tx.insertInto('hexchessGames').values({id:gameId,accessTokenHash:createHash('sha256').update(randomBytes(32)).digest('hex'),mode:'online',humanPlayer:0,state:native.state}).execute();
   await tx.insertInto('ionGameMembers').values(members.map(m=>({gameId,userId:m.userId,seat:m.seat}))).execute();
   lobby=await tx.updateTable('ionMatchLobbies').set({status:'playing',gameId}).where('id','=',lobby.id).returningAll().executeTakeFirstOrThrow();
  }
  return {lobby:{id:lobby.id,code:lobby.code,variant:lobby.variant,status:input.action==='cancel'?'cancelled':lobby.status,gameId:lobby.gameId,players:members.map(m=>({seat:m.seat,name:m.name})),needed} as Lobby,notify:[...new Set([...notifyPrevious,user.id,lobby.hostUserId,...members.map(m=>m.userId)])]};
 });
 if(input.action!=='get')await Promise.all(result.notify.map(id=>publish(channels.player(id),{lobbyId:result.lobby.id})));
 return new Response(JSON.stringify(result.lobby),{headers});
 }catch(e){const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;console.error('Online request',e instanceof Error?e.message:e);return new Response(JSON.stringify({error:status===503?'Couldn’t open this match. Try again.':e instanceof Error?e.message:'Check the room code.'}),{status,headers});}}
