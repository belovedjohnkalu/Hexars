import { createHash,randomBytes,randomUUID } from 'node:crypto';
import { publish } from '@floot/realtime';
import { db } from '../helpers/db';
import { optionalGameUser,onlineUser } from '../helpers/gameAccess';
import { channels } from '../helpers/realtimeChannels';
import { runNativeEngine } from '../helpers/runNativeEngine';
import type { Json } from '../helpers/schema';
import type { MoveRecord } from './game_POST.schema';
import { schema,type LibraryGame,type LibraryUndo } from './library_POST.schema';
function fail(message:string,status=404):never{throw Object.assign(new Error(message),{status});}
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};try{
 const input=schema.parse(await request.json());
 if(input.action==='get'){
  const user=await optionalGameUser(request);let gameId=input.gameId,share;
  if(input.token){share=await db.selectFrom('ionGameShares').selectAll().where('tokenHash','=',createHash('sha256').update(input.token).digest('hex')).where('revokedAt','is',null).executeTakeFirst();if(!share)fail('This shared game is no longer available.');gameId=share.gameId;}
  else if(input.shareId){if(!user)fail('Sign in to open this shared game.',401);share=await db.selectFrom('ionGameShares').selectAll().where('id','=',input.shareId).where('revokedAt','is',null).where(eb=>eb.or([eb('senderId','=',user.id),eb('recipientId','=',user.id)])).executeTakeFirst();if(!share)fail('This shared game is no longer available.');gameId=share.gameId;}
  if(!gameId)fail('Choose a saved game.',400);if(input.gameId&&input.gameId!==gameId)fail('This game is not available.');
  const member=user?await db.selectFrom('ionGameMembers').selectAll().where('gameId','=',gameId).where('userId','=',user.id).where('hiddenAt','is',null).executeTakeFirst():undefined;
  if(!share&&!member)fail(user?'This game is not in your Library.':'Sign in to open your Library.',user?404:401);
  const row=await db.selectFrom('hexchessGames').selectAll().where('id','=',gameId).executeTakeFirstOrThrow();
  let state:Json=row.state;const timeline=Array.isArray(row.timeline)?row.timeline:[];if(input.ply!==undefined){if(input.ply>timeline.length)fail('That move is not in this game.',400);if(input.ply<timeline.length)state=timeline[input.ply];}
  const native=await runNativeEngine({action:'inspect',state,origin:request.url});
  const players=row.mode==='online'?await db.selectFrom('ionGameMembers').innerJoin('users','users.id','ionGameMembers.userId').select(['ionGameMembers.seat','users.displayName as name']).where('gameId','=',row.id).where('seat','is not',null).orderBy('seat').execute():[];
  const dev=!!user&&!!await db.selectFrom('ionDevAccounts').select('userId').where('userId','=',user.id).executeTakeFirst();
  const identifier=dev?await db.selectFrom('ionCloudIdentifiers').select('label').where('nodeId','=',input.nodeId&&input.nodeId.endsWith('-u'+user!.id)?input.nodeId:`history-game-${row.id}-u${user!.id}`).executeTakeFirst():undefined;
  const out:LibraryGame={gameId:row.id,game:native.game,moves:(Array.isArray(row.moves)?row.moves:[]) as unknown as MoveRecord[],mode:row.mode,engineName:row.engineId==='positional'?'Positional':'Tactical',humanPlayer:row.mode==='online'?member?.seat??null:row.humanPlayer,players:players.map(p=>({seat:p.seat!,name:p.name})),canShare:!!member||!!share&&!!user&&(share.senderId===user.id||share.recipientId===user.id),...(share&&user?{shareRole:share.senderId===user.id?'sender' as const:'recipient' as const}:{}),canRemove:!!member||!!share&&!!user&&(share.senderId===user.id||share.recipientId===user.id),dev,identifier:identifier?.label};
  return new Response(JSON.stringify(out),{headers});
 }
 const user=await onlineUser(request);
 if(input.action==='remove'||input.action==='restore'){
  const restoring=input.action==='restore',removedAt=restoring?new Date(input.removedAt):new Date(),cutoff=new Date(Date.now()-10000);
  if(restoring&&removedAt<cutoff)fail('Undo is no longer available.',409);
  if(input.shareId){const share=await db.selectFrom('ionGameShares').selectAll().where('id','=',input.shareId).executeTakeFirst();if(!share||(share.senderId!==user.id&&share.recipientId!==user.id))fail('This shared game is not available.');const column=share.senderId===user.id?'revokedAt':'recipientHiddenAt';let query=db.updateTable('ionGameShares').set({[column]:restoring?null:removedAt}).where('id','=',share.id);if(restoring)query=query.where(column,'=',removedAt);const result=await query.executeTakeFirst();if(!result.numUpdatedRows)fail('This game changed. Reload your Library.',409);if(share.recipientId)await publish(channels.player(share.recipientId),{library:true});}
  else{if(!input.gameId)fail('Choose a saved game.',400);let query=db.updateTable('ionGameMembers').set({hiddenAt:restoring?null:removedAt}).where('gameId','=',input.gameId).where('userId','=',user.id);if(restoring)query=query.where('hiddenAt','=',removedAt);const result=await query.executeTakeFirst();if(!result.numUpdatedRows)fail('This game is not in your Library.');}
  await publish(channels.player(user.id),{library:true});const undo:LibraryUndo={gameId:input.gameId,shareId:input.shareId,removedAt:removedAt.toISOString(),expiresAt:removedAt.getTime()+10000};return new Response(JSON.stringify({ok:true,...(!restoring?{undo}:{})}),{headers});
 }
 const member=await db.selectFrom('ionGameMembers').select('gameId').where('gameId','=',input.gameId).where('userId','=',user.id).where('hiddenAt','is',null).executeTakeFirst();if(!member&&!await db.selectFrom('ionGameShares').select('id').where('gameId','=',input.gameId).where('revokedAt','is',null).where(eb=>eb.or([eb('senderId','=',user.id),eb.and([eb('recipientId','=',user.id),eb('recipientHiddenAt','is',null)])])).executeTakeFirst())fail('Only someone with this game can share it.',403);
 const recipient=input.recipientEmail?await db.selectFrom('users').select(['id','displayName']).where('email','=',input.recipientEmail).executeTakeFirst():undefined;
 if(input.recipientEmail&&!recipient)fail('That email does not have an account yet. Share a link instead.',400);if(recipient?.id===user.id)fail('Choose another account.',400);
 const game=await db.selectFrom('hexchessGames').select('state').where('id','=',input.gameId).executeTakeFirstOrThrow(),variant=game.state&&typeof game.state==='object'&&!Array.isArray(game.state)?String(game.state.variant):'glinski';
 const token=randomBytes(32).toString('hex'),id=randomUUID();await db.insertInto('ionGameShares').values({id,gameId:input.gameId,senderId:user.id,recipientId:recipient?.id??null,tokenHash:createHash('sha256').update(token).digest('hex')}).execute();
 await Promise.all([publish(channels.player(user.id),{library:true}),...(recipient?[publish(channels.player(recipient.id),{library:true})]:[])]);
 return new Response(JSON.stringify({shareId:id,path:`/${variant}?mode=saved&share=${token}`,recipient:recipient?.displayName}),{headers});
 }catch(e){const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;if(status>=500)console.error('Library request',e instanceof Error?e.message:e);return new Response(JSON.stringify({error:status===503?'Couldn’t open your Library. Try again.':e instanceof Error?e.message:'Check the details.'}),{status,headers});}}
