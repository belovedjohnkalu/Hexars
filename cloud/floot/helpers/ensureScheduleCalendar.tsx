import { randomUUID } from 'node:crypto';
import { publish } from '@floot/realtime';
import { db } from './db';
import { scheduleCalendar } from './scheduleCalendar';
import { cloudIdentifierStore } from './cloudIdentifierStore';
import { assertCloudCapacity } from './cloudCapacity';
import { channels } from './realtimeChannels';
import type { Json } from './schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export async function ensureScheduleCalendar(workspaceId:string,timeZone:string,devNumber:number){
 const result=await db.transaction().execute(async tx=>{
  const row=await tx.selectFrom('ionWorkspaces').selectAll().where('id','=',workspaceId).forUpdate().executeTakeFirstOrThrow();
  const nodes=(Array.isArray(row.nodes)?row.nodes:[]) as unknown as CloudNode[],next=scheduleCalendar.ensure(nodes,scheduleCalendar.today(new Date(),timeZone).year+4,randomUUID,row.ownerId||undefined);
  if(next===nodes)return {row,changed:false};assertCloudCapacity(nodes,next);
  const updated=await tx.updateTable('ionWorkspaces').set({nodes:next as unknown as Json,version:row.version+1,updatedAt:new Date()}).where('id','=',row.id).returningAll().executeTakeFirstOrThrow();return {row:updated,changed:true};
 });
 // Allocate permanent labels even when the first request comes from a visitor.
 await cloudIdentifierStore(result.row.nodes as unknown as CloudNode[],devNumber);
 if(result.changed)try{await publish(channels.cloud('home',0),{version:result.row.version});}catch{console.error('Schedule refresh delayed');}
 return result.row;
}
