import { getServerSessionOrThrow,NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { createHash,randomBytes } from "node:crypto";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { setServerSession,SessionExpirationSeconds } from "../../helpers/getSetServerSession";
import { schema } from "./accounts_POST.schema";
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
function deviceCookie(request:Request){return (request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ion_device='))?.slice('ion_device='.length)||'';}
export async function handle(request:Request){
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};try{
  const input=schema.parse(await request.json()),now=new Date();let token=deviceCookie(request),hash=token?digest(token):'',setCookie='';
  if(input.action==='remember'){
   const {user,session}=await getServerUserSession(request);let device=hash?await db.selectFrom('ionRememberedDevices').selectAll().where('tokenHash','=',hash).where('expiresAt','>',now).executeTakeFirst():undefined;
   if(!device){token=randomBytes(32).toString('hex');hash=digest(token);await db.insertInto('ionRememberedDevices').values({tokenHash:hash,expiresAt:new Date(Date.now()+30*86400000)}).execute();setCookie='ion_device='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000';}
   await db.transaction().execute(async tx=>{
    const previous=await tx.selectFrom('ionDeviceAccounts').select('sessionId').where('deviceHash','=',hash).where('userId','=',user.id).forUpdate().executeTakeFirst();
    await tx.insertInto('ionDeviceAccounts').values({deviceHash:hash,userId:user.id,sessionId:session.id}).onConflict(c=>c.columns(['deviceHash','userId']).doUpdateSet({sessionId:session.id})).execute();
    if(previous&&previous.sessionId!==session.id&&!await tx.selectFrom('ionDeviceAccounts').select('sessionId').where('sessionId','=',previous.sessionId).executeTakeFirst())await tx.deleteFrom('sessions').where('id','=',previous.sessionId).where('userId','=',user.id).execute();
   });
  }
  const accounts=hash?await db.selectFrom('ionDeviceAccounts').innerJoin('ionRememberedDevices','ionDeviceAccounts.deviceHash','ionRememberedDevices.tokenHash').innerJoin('sessions','ionDeviceAccounts.sessionId','sessions.id').innerJoin('users','ionDeviceAccounts.userId','users.id').select(['users.id','users.email','users.displayName','sessions.id as sessionId']).whereRef('sessions.userId','=','ionDeviceAccounts.userId').where('deviceHash','=',hash).where('ionRememberedDevices.expiresAt','>',now).where('sessions.expiresAt','>',now).execute():[];
  if(input.action==='forget'){await db.deleteFrom('ionDeviceAccounts').where('deviceHash','=',hash).where('userId','=',input.userId).execute();}
  if(input.action==='switch'){
   const account=accounts.find(a=>a.id===input.userId);if(!account)return new Response(JSON.stringify({error:'Sign in to that account again.'}),{status:401,headers});
   let currentSession:string|undefined;try{currentSession=(await getServerSessionOrThrow(request)).id;}catch(e){if(!(e instanceof NotAuthenticatedError))throw e;}
   const sessionId=randomBytes(32).toString('hex');await db.transaction().execute(async tx=>{
    const previous=await tx.selectFrom('ionDeviceAccounts').innerJoin('sessions','sessions.id','ionDeviceAccounts.sessionId').select('ionDeviceAccounts.sessionId').where('deviceHash','=',hash).where('ionDeviceAccounts.userId','=',account.id).whereRef('sessions.userId','=','ionDeviceAccounts.userId').where('sessions.expiresAt','>',new Date()).forUpdate('ionDeviceAccounts').executeTakeFirst();
    if(!previous)throw new Error('Sign in to that account again.');
    if(currentSession)await tx.deleteFrom('ionPushSubscriptions').where('sessionId','=',currentSession).execute();
    await tx.insertInto('sessions').values({id:sessionId,userId:account.id,createdAt:now,lastAccessed:now,expiresAt:new Date(Date.now()+SessionExpirationSeconds*1000)}).execute();
    await tx.updateTable('ionDeviceAccounts').set({sessionId}).where('deviceHash','=',hash).where('userId','=',account.id).execute();
    if(!await tx.selectFrom('ionDeviceAccounts').select('sessionId').where('sessionId','=',previous.sessionId).executeTakeFirst())await tx.deleteFrom('sessions').where('id','=',previous.sessionId).where('userId','=',account.id).execute();
   });
   const response=new Response(JSON.stringify({accounts:accounts.map(a=>({id:a.id,email:a.email,displayName:a.displayName})),switched:true}),{headers});await setServerSession(response,{id:sessionId,createdAt:now.getTime(),lastAccessed:now.getTime()});return response;
  }
  const response=new Response(JSON.stringify({accounts:accounts.filter(a=>input.action!=='forget'||a.id!==input.userId).map(a=>({id:a.id,email:a.email,displayName:a.displayName}))}),{headers});if(setCookie)response.headers.append('Set-Cookie',setCookie);return response;
 }catch(e){return new Response(JSON.stringify({error:e instanceof Error&&e.name==='NotAuthenticatedError'?'Sign in to save this account.':'Couldn’t update saved accounts.'}),{status:e instanceof Error&&e.name==='NotAuthenticatedError'?401:400,headers});}
}
