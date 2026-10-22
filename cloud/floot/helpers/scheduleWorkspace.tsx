import { randomUUID } from 'node:crypto';
import { db } from './db';
// The authenticated user ID is the only selector. Client workspace credentials
// and dev membership never grant another account's schedule access.
export async function scheduleWorkspace(userId:number){
 return db.transaction().execute(async tx=>{
  await tx.selectFrom('users').select('id').where('id','=',userId).forUpdate().executeTakeFirstOrThrow();
  const existing=await tx.selectFrom('ionScheduleAccounts').innerJoin('ionWorkspaces','ionScheduleAccounts.workspaceId','ionWorkspaces.id').selectAll('ionWorkspaces').where('userId','=',userId).executeTakeFirst();if(existing)return existing;
  const row=await tx.insertInto('ionWorkspaces').values({id:randomUUID(),ownerId:userId,accessTokenHash:'0'.repeat(64),nodes:[]}).returningAll().executeTakeFirstOrThrow();
  await tx.insertInto('ionScheduleAccounts').values({userId,workspaceId:row.id}).execute();return row;
 });
}
