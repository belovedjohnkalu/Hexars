import { sql } from 'kysely';
import { db } from '../helpers/db';
import { onlineUser } from '../helpers/gameAccess';
import { historyClouds } from '../helpers/historyClouds';
import { cloudTree } from '../helpers/cloudTree';
import { cloudIdentifierStore } from '../helpers/cloudIdentifierStore';
import { chessVariants } from '../helpers/chessVariants';
import type { CloudNode } from './cloud_POST.schema';
import { schema,type HistoryGame } from './history_POST.schema';
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};try{
 const user=await onlineUser(request),{timeZone}=schema.parse(await request.json());new Intl.DateTimeFormat('en',{timeZone}).format();
 const rows=await sql<HistoryGame>`SELECT g.id,g.state->>'variant' AS variant,to_char(g.created_at AT TIME ZONE ${timeZone},'YYYY-MM-DD') AS date,to_char(g.created_at AT TIME ZONE ${timeZone},'HH24:MI') AS time FROM hexchess_games g JOIN ion_game_members m ON m.game_id=g.id WHERE m.user_id=${user.id} AND m.hidden_at IS NULL AND jsonb_array_length(g.moves)>0 ORDER BY g.created_at DESC,g.id`.execute(db);
 const shares=await db.selectFrom('ionGameShares').innerJoin('hexchessGames','hexchessGames.id','ionGameShares.gameId').select(['ionGameShares.id','gameId','senderId','recipientId',sql<string>`hexchess_games.state->>'variant'`.as('variant')]).where('revokedAt','is',null).where(eb=>eb.or([eb('senderId','=',user.id),eb.and([eb('recipientId','=',user.id),eb('recipientHiddenAt','is',null)])])).orderBy('ionGameShares.createdAt','desc').execute();
 let nodes:CloudNode[]=historyClouds(rows.rows,user.id);
 for(const share of shares){if(!chessVariants.isId(share.variant))continue;for(const parentId of [...(share.senderId===user.id?['shared-sent']:[]),...(share.recipientId===user.id?['shared-received']:[])])nodes.push({id:parentId+'-'+share.id+'-u'+user.id,parentId,name:chessVariants.name(share.variant)+'’s Variant',savedGameId:share.gameId,shareId:share.id,variant:share.variant,destination:'saved-game',isImage:true,color:parentId==='shared-sent'?'amber':'lavender',system:true});}
 const dev=!!await db.selectFrom('ionDevAccounts').select('userId').where('userId','=',user.id).executeTakeFirst();
 if(dev){const identifiers=await cloudIdentifierStore([...cloudTree.forScope('chess'),...nodes]);nodes=nodes.map(node=>({...node,identifier:identifiers.get(node.id)?.label}));}
 const cutoff=new Date(Date.now()-10000);
 const hidden=await db.selectFrom('ionGameMembers').select(['gameId','hiddenAt']).where('userId','=',user.id).where('hiddenAt','>',cutoff).orderBy('hiddenAt','desc').executeTakeFirst();
 const removedShares=await db.selectFrom('ionGameShares').selectAll().where(eb=>eb.or([eb.and([eb('senderId','=',user.id),eb('revokedAt','>',cutoff)]),eb.and([eb('recipientId','=',user.id),eb('recipientHiddenAt','>',cutoff)])])).execute();
 const candidates=[...(hidden?.hiddenAt?[{gameId:hidden.gameId,removedAt:new Date(hidden.hiddenAt).toISOString(),expiresAt:new Date(hidden.hiddenAt).getTime()+10000}]:[]),...removedShares.map(s=>{const removed=s.senderId===user.id?s.revokedAt:s.recipientHiddenAt;return{shareId:s.id,removedAt:new Date(removed!).toISOString(),expiresAt:new Date(removed!).getTime()+10000};})].sort((a,b)=>b.expiresAt-a.expiresAt);
 return new Response(JSON.stringify({games:rows.rows,nodes,undo:candidates[0]}),{headers});
 }catch(e){const status=e&&typeof e==='object'&&'status'in e?Number(e.status):400;return new Response(JSON.stringify({error:e instanceof Error?e.message:'Couldn’t open your Library.'}),{status,headers});}}
