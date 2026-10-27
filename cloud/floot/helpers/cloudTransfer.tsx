import { cloudTransferNodes } from './cloudTransferNodes';
import {uniqueCloudNames} from './uniqueCloudNames';
import { assertCloudWordLimits } from './cloudWordLimits';
import { assertCloudCapacity } from "./cloudCapacity";
import { cloudIdentifierStore } from "./cloudIdentifierStore";
import { transferNodeIds } from "./cloudIdentifiers";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { cloudContext } from "./cloudContext";
import { cloudPolicy } from "./cloudPolicy";
import { cloudTree } from "./cloudTree";
import type { InputType,CloudNode } from "../endpoints/cloud_POST.schema";
import type { Json } from "./schema";
export async function cloudTransfer(request:Request,raw:Extract<InputType,{action:'transfer'}>){
 const input={...raw,scope:raw.scope||'private'};
 if(!['public','private'].includes(input.scope)||input.scope===input.targetScope)cloudPolicy.fail('Choose Safari or Journal.',400);
 const source=await cloudContext(request,input),target=await cloudContext(request,{...input,scope:input.targetScope,action:'load'});
 if(!source.userId||!source.row||!target.row)cloudPolicy.fail('Sign in to transfer a cloud.',401);
 if(source.owner||input.scope==='public')await cloudIdentifierStore([...cloudTree.forScope(input.scope),...(source.row!.nodes as unknown as CloudNode[])],source.devNumber);
 const uid=source.userId!,sourceId=source.row!.id,targetId=target.row!.id;
 await db.transaction().execute(async tx=>{
  await tx.selectFrom('users').select('id').where('id','=',uid).forUpdate().executeTakeFirstOrThrow();
  const previous=await tx.selectFrom('ionCloudTransfers').selectAll().where('operationId','=',input.operationId).executeTakeFirst();
  if(previous){if(previous.userId===uid&&previous.sourceWorkspace===sourceId&&previous.targetWorkspace===targetId&&previous.sourceNode===input.id&&previous.targetParent===input.targetParent&&previous.kind===input.mode)return;cloudPolicy.fail('This transfer could not be repeated.',409);}
  const rows=await tx.selectFrom('ionWorkspaces').selectAll().where('id','in',[sourceId,targetId]).orderBy('id').forUpdate().execute();
  const a=rows.find(r=>r.id===sourceId)!,b=rows.find(r=>r.id===targetId)!;
  if(a.version!==input.version||b.version!==input.targetVersion)cloudPolicy.fail('A cloud changed. Check the destination and try again.',409);
  const stored=a.nodes as unknown as CloudNode[],existing=b.nodes as unknown as CloudNode[],all=[...cloudTree.forScope(input.scope),...stored].filter(n=>!n.removedBy),dest=[...cloudTree.forScope(input.targetScope),...existing].find(n=>n.id===input.targetParent&&!n.removedBy&&!n.destination);
  if(!dest)cloudPolicy.fail('Choose an existing destination.',400);
  const group=cloudPolicy.branch(all,input.id);if(!group.length||['public','private','hexagonal-chess'].includes(input.id))cloudPolicy.fail('Choose a droplet inside the cloud.',400);
  if(input.mode==='move')cloudPolicy.assert(input.scope,all,input.id,uid,source.owner,true);
  if(existing.some(n=>n.id===input.operationId))cloudPolicy.fail('Choose a new transfer.',409);
  const ids=transferNodeIds(group,input.id,input.operationId,input.mode==='copy',randomUUID);
  if(existing.some(n=>[...ids.values()].includes(n.id)))cloudPolicy.fail('This cloud is already in the destination.',409);
  const added=cloudTransferNodes(group,ids,input.id,input.targetParent,input.operationId,uid,input.mode==='copy');
  uniqueCloudNames([...cloudTree.forScope(input.targetScope),...existing],[...cloudTree.forScope(input.targetScope),...existing,...added]);
  assertCloudWordLimits([...cloudTree.forScope(input.targetScope),...existing],[...cloudTree.forScope(input.targetScope),...existing,...added],input.targetScope);
  assertCloudCapacity([...cloudTree.forScope(input.targetScope),...existing],[...cloudTree.forScope(input.targetScope),...existing,...added]);
  await tx.updateTable('ionWorkspaces').set({nodes:[...existing,...added] as unknown as Json,version:b.version+1,updatedAt:new Date()}).where('id','=',b.id).execute();
  if(input.mode==='move')await tx.updateTable('ionWorkspaces').set({nodes:stored.filter(n=>!ids.has(n.id)) as unknown as Json,version:a.version+1,updatedAt:new Date()}).where('id','=',a.id).execute();
  await tx.insertInto('ionCloudTransfers').values({operationId:input.operationId,userId:uid,sourceWorkspace:sourceId,targetWorkspace:targetId,sourceNode:input.id,targetParent:input.targetParent,kind:input.mode}).execute();
 });
 if(target.owner||input.targetScope==='public'){const latest=await db.selectFrom('ionWorkspaces').select('nodes').where('id','=',targetId).executeTakeFirstOrThrow();await cloudIdentifierStore([...cloudTree.forScope(input.targetScope),...(latest.nodes as unknown as CloudNode[])]);}
 return {sourceId,targetId,userId:uid};
}
