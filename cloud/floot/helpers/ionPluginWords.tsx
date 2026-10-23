import { db } from './db';
import { accountPrivateWorkspace } from './cloudWorkspace';
import { scheduleWorkspace } from './scheduleWorkspace';
import { scheduleCalendar } from './scheduleCalendar';
import { ensureScheduleCalendar } from './ensureScheduleCalendar';
import { accountTimeZone } from './accountTimeZone';
import { timeAccess } from './timeAccess';
import { cloudTree } from './cloudTree';
import { assertCloudWordLimits,cloudWordLimit } from './cloudWordLimits';
import { assertCloudCapacity } from './cloudCapacity';
import { unusedColor } from './cloudColors';
import { cloudIdentifierStore } from './cloudIdentifierStore';
import { namespaceIdentifier } from './cloudIdentifiers';
import { channels } from './realtimeChannels';
import { publish } from '@floot/realtime';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { Json } from './schema';
export type PluginSpace='journal'|'schedule';
const fail=(message:string,status=400):never=>{throw Object.assign(new Error(message),{status});};
export async function pluginWords(userId:number,space:PluginSpace){
 if(space==='schedule')await timeAccess.feature(userId,'feature:schedule');
 const row=space==='schedule'?await scheduleWorkspace(userId):await accountPrivateWorkspace(userId);
 if(row.ownerId!==userId)fail('This space is unavailable.',403);
 let seeds=cloudTree.forScope('private');
 if(space==='schedule'){
  const home=await db.selectFrom('ionSharedSpaces').select('workspaceId').where('kind','=','home').executeTakeFirstOrThrow(),zone=await accountTimeZone(userId),template=await ensureScheduleCalendar(home.workspaceId,zone,0);
  seeds=(template.nodes as unknown as CloudNode[]).filter(n=>!n.removedBy&&(n.id===scheduleCalendar.root||n.calendarDate)).map(n=>n.id===scheduleCalendar.root?{...n,parentId:null}:n);
 }
 const stored=(Array.isArray(row.nodes)?row.nodes:[]) as unknown as CloudNode[],all=[...new Map([...seeds,...stored].map(n=>[n.id,n])).values()].filter(n=>!n.removedBy);
 return{row,stored,all,root:space==='schedule'?scheduleCalendar.root:'private',scope:space==='schedule'?'schedule' as const:'private' as const};
}
const link=(id:string,scope:string)=>'https://ion.floot.app/?'+new URLSearchParams({cloud:id,space:scope});
export async function listPluginWords(userId:number,input:{space:PluginSpace;parentId?:string;offset:number;limit:number}){
 const state=await pluginWords(userId,input.space),parentId=input.parentId||state.root,parent=state.all.find(n=>n.id===parentId);if(!parent)fail('Choose a word from your own space.',404);
 const dev=await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',userId).executeTakeFirst(),registry=dev?await cloudIdentifierStore(state.all,Number(dev.devNumber)):undefined;
 const items=state.all.filter(n=>n.parentId===parentId),children=new Map<string,number>();for(const n of state.all)if(n.parentId)children.set(n.parentId,(children.get(n.parentId)||0)+1);
 return{space:input.space,parent:{id:parentId,name:parent!.name},version:state.row.version,wordLimit:state.scope==='private'?cloudWordLimit(state.all,parentId).toString():null,total:items.length,nextOffset:input.offset+input.limit<items.length?input.offset+input.limit:null,words:items.slice(input.offset,input.offset+input.limit).map(n=>({id:n.id,name:n.name,children:children.get(n.id)||0,hasPicture:!!(n.imageKey||n.imageKeys?.length||n.imageUrl),...(dev?{identifier:namespaceIdentifier(registry?.get(n.id)?.label,Number(dev.devNumber))}:{}),url:link(n.id,state.scope)})),url:link(parentId,state.scope)};
}
export async function addPluginWord(userId:number,input:{space:PluginSpace;parentId:string;name:string;id:string;version:number}){
 const state=await pluginWords(userId,input.space),existing=state.stored.find(n=>n.id===input.id);
 if(existing){if(!existing.removedBy&&existing.parentId===input.parentId&&existing.name===input.name)return{id:existing.id,name:existing.name,version:state.row.version,url:link(existing.id,state.scope),saved:true};return fail('Use a new request ID for a new word.',409);}
 if(input.version!==state.row.version)fail('Your space changed. Read it again before saving.',409);
 const parent=state.all.find(n=>n.id===input.parentId);if(!parent||parent.destination||parent.href||parent.redirect)fail('Choose an existing word in your space.',400);
 const node:CloudNode={id:input.id,parentId:input.parentId,name:input.name,createdBy:userId,color:unusedColor('white',state.all.filter(n=>n.parentId===input.parentId).map(n=>n.color))};
 assertCloudWordLimits(state.all,[...state.all,node],state.scope);assertCloudCapacity(state.all,[...state.all,node]);
 const updated=await db.updateTable('ionWorkspaces').set({nodes:[...state.stored,node] as unknown as Json,version:state.row.version+1,updatedAt:new Date()}).where('id','=',state.row.id).where('ownerId','=',userId).where('version','=',input.version).returning('version').executeTakeFirst();if(!updated)fail('Your space changed. Read it again before saving.',409);
 const dev=await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',userId).executeTakeFirst();if(dev)await cloudIdentifierStore([...state.all,node],Number(dev.devNumber));
 await Promise.allSettled([publish(channels.cloud(state.scope,userId),{version:updated!.version,workspaceId:state.row.id}),publish(channels.cloud('home',userId),{changed:true})]);
 return{id:node.id,name:node.name,version:updated!.version,url:link(node.id,state.scope),saved:true};
}
export const ionPluginWords={list:listPluginWords,add:addPluginWord};
