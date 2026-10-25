import {cloudTree} from './cloudTree';
import {renamedSharedRoot} from './sharedRootNameProjection';
import {db} from './db';
import {publish} from '@floot/realtime';
import {channels} from './realtimeChannels';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
import type {Json} from './schema';

export async function saveSharedRootName(workspaceId:string,version:number,nodes:CloudNode[]){
 const updates=await db.transaction().execute(async tx=>{const config=await tx.selectFrom('ionSharedSpaces').select(['kind','workspaceId']).where('kind','in',['home','chess']).execute(),ids=config.map(n=>n.workspaceId).sort(),rows=await tx.selectFrom('ionWorkspaces').selectAll().where('id','in',ids).orderBy('id').forUpdate().execute(),source=rows.find(r=>r.id===workspaceId),name=nodes.find(n=>n.id==='hexagonal-chess')?.name;
  if(!source||source.version!==version||!name)throw Object.assign(Error('Your cloud changed. Try again.'),{status:409});const results:{scope:'home'|'chess';id:string;version:number}[]=[];
  for(const row of rows){const current=(Array.isArray(row.nodes)?row.nodes:[])as unknown as CloudNode[],next=row.id===workspaceId?nodes:renamedSharedRoot(current,name,cloudTree.forScope(config.find(n=>n.workspaceId===row.id)!.kind as 'home'|'chess').find(n=>n.id==='hexagonal-chess'));if(row.id!==workspaceId&&JSON.stringify(current)===JSON.stringify(next))continue;const updated=await tx.updateTable('ionWorkspaces').set({nodes:next as unknown as Json,version:row.version+1,updatedAt:new Date()}).where('id','=',row.id).returning('version').executeTakeFirstOrThrow();results.push({scope:config.find(n=>n.workspaceId===row.id)!.kind as 'home'|'chess',id:row.id,version:updated.version});}return results;});
 await Promise.allSettled([...updates.map(u=>publish(channels.cloud(u.scope,0),{workspaceId:u.id,version:u.version})),publish(channels.timeCatalog,{changed:true})]);return{version:updates.find(u=>u.id===workspaceId)!.version};
}
