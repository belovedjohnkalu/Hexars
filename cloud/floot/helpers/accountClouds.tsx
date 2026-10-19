import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { rememberedAccounts } from './rememberedAccounts';
import { cloudTree } from './cloudTree';
import { db } from './db';
import { randomUUID } from 'node:crypto';
export async function accountClouds(request:Request,userId:number|null){
 const saved=await rememberedAccounts(request),nodes:CloudNode[]=[{...cloudTree.roots.find(n=>n.id==='accounts')!,parentId:null,destination:undefined}];
 const add=(id:string,name:string,action:string,parentId='accounts',color:CloudNode['color']='white')=>nodes.push({id,parentId,name,destination:'account',accountAction:action,system:true,color});
 if(userId){add('account-add','Add account','add','accounts','cyan');if(!saved.some(a=>a.id===userId))add('account-remember','Remember','remember','accounts','mint');add('account-signout','Sign out','signout','accounts','coral');}
 else{add('account-signin','Sign in','signin','accounts','blue');add('account-create','Create account','signup','accounts','mint');}
 add('account-recover','Recover password','recover','accounts','amber');
 for(const a of saved){const id='remembered-'+a.id;nodes.push({id,parentId:'accounts',name:a.displayName,color:a.id===userId?'mint':'lavender',system:true});if(a.id!==userId)add(id+'-open','Open','switch:'+a.id,id,'blue');add(id+'-forget','Forget','forget:'+a.id,id,'coral');}
 return nodes;
}
export async function accountWorkspace(userId:number){
 return db.transaction().execute(async tx=>{
  await tx.selectFrom('users').select('id').where('id','=',userId).forUpdate().executeTakeFirstOrThrow();
  const existing=await tx.selectFrom('ionAccountSpaces').innerJoin('ionWorkspaces','ionAccountSpaces.workspaceId','ionWorkspaces.id').selectAll('ionWorkspaces').where('userId','=',userId).executeTakeFirst();
  if(existing)return existing;
  const row=await tx.insertInto('ionWorkspaces').values({id:randomUUID(),accessTokenHash:'0'.repeat(64),ownerId:userId,nodes:[]}).returningAll().executeTakeFirstOrThrow();
  await tx.insertInto('ionAccountSpaces').values({userId,workspaceId:row.id}).execute();return row;
 });
}
