import { functionClouds } from './functionClouds';
import { timeAccess } from './timeAccess';
import { scheduleWorkspace } from './scheduleWorkspace';
import { scheduleCalendar } from './scheduleCalendar';
import { ensureScheduleCalendar } from './ensureScheduleCalendar';
import { accountTimeZone } from './accountTimeZone';
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
 const shared=config.find(c=>c.kind===scope),owner=isDev;
 const namespaceUser=scope==='private'||scope==='accounts'?userId:shared?.ownerUserId;
 const namespace=namespaceUser?await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',namespaceUser).executeTakeFirst():undefined,devNumber=Number(namespace?.devNumber??0);
 if(scope==='schedule'){
  if(!userId)cloudPolicy.fail('Sign in to open Schedule.',401);
  await timeAccess.feature(userId,'feature:schedule');
  const home=config.find(c=>c.kind==='home');if(!home)throw new Error('Schedule unavailable');
  const zone=await accountTimeZone(userId,input.action==='load'?input.timeZone:undefined);
  const template=await ensureScheduleCalendar(home.workspaceId,zone,Number(namespace?.devNumber??0));
  const seeds=(template.nodes as unknown as import('../endpoints/cloud_POST.schema').CloudNode[]).filter(n=>!n.removedBy&&(n.id===scheduleCalendar.root||n.calendarDate)).map(n=>n.id===scheduleCalendar.root?{...n,parentId:null}:n);
  return {row:await scheduleWorkspace(userId!),userId,owner:isDev,isDev,devNumber:Number(dev?.devNumber??0),scope,seeds};
 }
 if(scope==='accounts'){const seeds=await accountClouds(request,userId,isDev);if(input.action!=='load'&&!owner)cloudPolicy.fail('Only dev accounts can change Accounts.',userId?403:401);return {row:userId?await accountWorkspace(userId):null,userId,owner,isDev,devNumber,scope,seeds};}
 if(scope==='private'){if(!userId)cloudPolicy.fail('Sign in to open Journal.',401);const row=await cloudWorkspace(request,input);return {row,userId,owner,isDev,devNumber,scope,seeds:cloudTree.forScope(scope)};}
 const id=config.find(c=>c.kind===scope)?.workspaceId;if(!id)throw new Error('Space unavailable');
 if(input.action!=='load'&&!cloudPolicy.writable(scope,userId,owner))cloudPolicy.fail((scope==='chess'||scope==='home')?'Only dev accounts can change this space.':'Sign in to add to Safari.',userId?403:401);
 const row=await db.selectFrom('ionWorkspaces').selectAll().where('id','=',id!).executeTakeFirstOrThrow();return {row,userId,owner,isDev,devNumber,scope,seeds:scope==='home'&&isDev?[...new Map([...functionClouds.filter(n=>n.id.startsWith('time-')),...cloudTree.forScope(scope)].map(n=>[n.id,n])).values()]:cloudTree.forScope(scope)};
}
