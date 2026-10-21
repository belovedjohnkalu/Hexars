import { accountClouds,accountWorkspace } from "./accountClouds";
import { db } from "./db";
import { getServerUserSession } from "./getServerUserSession";
import { NotAuthenticatedError } from "./getSetServerSession";
import { cloudWorkspace } from "./cloudWorkspace";
import { cloudTree } from "./cloudTree";
import { cloudPolicy } from "./cloudPolicy";
import type { InputType } from "../endpoints/cloud_POST.schema";
export async function cloudContext(request:Request,input:InputType){
 let userId:number|null=null;try{userId=(await getServerUserSession(request)).user.id;}catch(e){if(!(e instanceof NotAuthenticatedError))throw e;}
 const config=await db.selectFrom('ionSharedSpaces').selectAll().execute(),dev=userId?await db.selectFrom('ionDevAccounts').select(['userId','devNumber']).where('userId','=',userId).executeTakeFirst():undefined,scope=input.scope||"private",isDev=!!dev;
 const shared=config.find(c=>c.kind===scope),owner=isDev&&(!shared||shared.ownerUserId===userId);
 const namespaceUser=scope==='private'||scope==='accounts'?userId:shared?.ownerUserId;
 const namespace=namespaceUser?await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',namespaceUser).executeTakeFirst():undefined,devNumber=Number(namespace?.devNumber??0);
 if(scope==='accounts'){const seeds=await accountClouds(request,userId,isDev);if(input.action!=='load'&&!owner)cloudPolicy.fail('Only dev accounts can change Accounts.',userId?403:401);return {row:userId?await accountWorkspace(userId):null,userId,owner,isDev,devNumber,scope,seeds};}
 if(scope==='private'){if(!userId)cloudPolicy.fail('Sign in to open Private.',401);const row=await cloudWorkspace(request,input);return {row,userId,owner,isDev,devNumber,scope,seeds:cloudTree.forScope(scope)};}
 const id=config.find(c=>c.kind===scope)?.workspaceId;if(!id)throw new Error('Space unavailable');
 if(input.action!=='load'&&!cloudPolicy.writable(scope,userId,owner))cloudPolicy.fail((scope==='chess'||scope==='home')?'Only dev accounts can change this space.':'Sign in to add to Public.',userId?403:401);
 const row=await db.selectFrom('ionWorkspaces').selectAll().where('id','=',id!).executeTakeFirstOrThrow();return {row,userId,owner,isDev,devNumber,scope,seeds:cloudTree.forScope(scope)};
}
