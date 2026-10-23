import { db } from './db';
import { publish } from '@floot/realtime';
import { channels } from './realtimeChannels';
import type { CloudScope } from '../endpoints/cloud_POST.schema';
// Administrative data changes use the same realtime channel as normal edits.
// A failed delivery stays queued for the next authorized load; no polling job.
export async function drainCloudRefresh(workspaceId:string,version:number,scope:CloudScope,userId:number){
 try{const pending=await db.selectFrom('ionWorkspaceRefresh').select('version').where('workspaceId','=',workspaceId).where('version','<=',version).executeTakeFirst();if(!pending)return;
 await publish(channels.cloud(scope,userId),{version:pending.version,workspaceId});
 await db.deleteFrom('ionWorkspaceRefresh').where('workspaceId','=',workspaceId).where('version','<=',pending.version).execute();
 }catch{console.error('Workspace refresh delayed');}
}
