import { createHash } from 'node:crypto';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './push_POST.schema';
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};try{
 const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return new Response(JSON.stringify({error:'Open notifications in ION.'}),{status:403,headers});
 const {user,session}=await getServerUserSession(request),text=await request.text();if(text.length>24000)return new Response(JSON.stringify({error:'Request too large.'}),{status:413,headers});const input=schema.parse(JSON.parse(text));
 if(input.accountId!==user.id)return new Response(JSON.stringify({error:'Your account changed. Try again.'}),{status:409,headers});
 if(input.action==='status'){const subscription=await db.selectFrom('ionPushSubscriptions').select('identityHash').where('userId','=',user.id).where('sessionId','=',session.id).where('identityHash','=',createHash('sha256').update(input.identity).digest('hex')).executeTakeFirst();return new Response(JSON.stringify({enabled:!!subscription}),{headers});}
 if(input.action==='remove'){
  let q=db.deleteFrom('ionPushSubscriptions').where('userId','=',user.id).where('sessionId','=',session.id);if(input.identity)q=q.where('identityHash','=',createHash('sha256').update(input.identity).digest('hex'));await q.execute();
 }else{
  const sub=input.subscription,identity='endpoint' in sub?sub.endpoint:'fcmToken' in sub?sub.fcmToken:sub.apnsToken,identityHash=createHash('sha256').update(identity).digest('hex');
  await db.transaction().execute(async tx=>{
   // One active identity per browser/session; a reused device belongs only to its current account.
   await tx.deleteFrom('ionPushSubscriptions').where('sessionId','=',session.id).where('identityHash','!=',identityHash).execute();
   await tx.insertInto('ionPushSubscriptions').values({identityHash,userId:user.id,sessionId:session.id,subscription:sub}).onConflict(c=>c.column('identityHash').doUpdateSet({userId:user.id,sessionId:session.id,subscription:sub,updatedAt:new Date()})).execute();
  });
 }
 return new Response(JSON.stringify({ok:true}),{headers});
 }catch(e){const status=e instanceof Error&&e.name==='NotAuthenticatedError'?401:e instanceof SyntaxError||e&&typeof e==='object'&&'issues' in e?400:503;return new Response(JSON.stringify({error:status===401?'Sign in to enable notifications.':'Couldn’t update notifications. Try again.'}),{status,headers});}}
