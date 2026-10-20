import { publish } from '@floot/realtime';
import { schema } from './time_POST.schema';
import { optionalGameUser } from '../helpers/gameAccess';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { setServerSession } from '../helpers/getSetServerSession';
import { timeLedger,timeFail } from '../helpers/timeLedger';
import { timeOperations } from '../helpers/timeOperations';
import { channels } from '../helpers/realtimeChannels';
import { db } from '../helpers/db';
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store'};
export async function handle(request:Request){try{
 const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)timeFail('Open Time in ION to continue.',403);
 const text=await request.text();if(text.length>12000)timeFail('Request too large.',413);const input=schema.parse(JSON.parse(text));
 if(input.action==='snapshot'){const user=await optionalGameUser(request);return new Response(JSON.stringify({snapshot:await timeLedger.snapshot(user?.id??null)}),{headers});}
 const {user,session}=await getServerUserSession(request),result=await timeOperations(input,user.id,session.id);
 if(input.action==='confirm'||input.action==='approve'||input.action==='earning'&&result.earning&&result.earning.creditedUs!=='0'){
  const ids=new Set([user.id]);if(input.action==='confirm'){const q=await db.selectFrom('ionTimeQuotes').select('recipientId').where('id','=',input.quoteId).where('actorId','=',user.id).executeTakeFirst();if(q?.recipientId)ids.add(q.recipientId);}
  // Committed ledger operations never fail merely because realtime is offline.
  await Promise.allSettled([...ids].map(id=>publish(channels.time(id),{changed:true})));
  if(input.action==='confirm')await Promise.allSettled([publish(channels.timeTreasury,{changed:true})]);
  if(input.action==='approve')await Promise.allSettled([publish(channels.timeCatalog,{changed:true})]);
 }
 const response=new Response(JSON.stringify(result),{headers});
 if(input.action==='earning'&&(!session.credentialExpiresAt||session.credentialExpiresAt-Date.now()<43200000))await setServerSession(response,{id:session.id,createdAt:session.createdAt,lastAccessed:session.lastAccessed.getTime()});
 return response;
 }catch(error){const e=error as {status?:number;code?:string;name?:string;message?:string;issues?:unknown},status=e.message==='Not enough Time'?409:e.status||(e.name==='NotAuthenticatedError'?401:e.issues?400:503);if(status>=500)console.error('Time request',e.message);const message=e.message==='Not enough Time'?'Not enough Time.':status>=500?'Couldn’t update Time. Try again.':e.name==='NotAuthenticatedError'?'Sign in to use Time.':e.issues?'Check the amount and try again.':e.message||'Couldn’t update Time.';return new Response(JSON.stringify({error:message,...(e.code?{code:e.code}:{})}),{status:e.message==='Not enough Time'?409:status,headers});}}
