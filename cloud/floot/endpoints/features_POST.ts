import { db } from '../helpers/db';
import { publish } from '@floot/realtime';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { cloudContext } from '../helpers/cloudContext';
import { visibleDevClouds } from '../helpers/devPromptWorkflow';
import { featureClouds } from '../helpers/featureClouds';
import { hiddenFeaturesId } from '../helpers/homeFeatures';
import { timeLedger } from '../helpers/timeLedger';
import { channels } from '../helpers/realtimeChannels';
import type { CloudNode } from './cloud_POST.schema';
import { schema } from './features_POST.schema';
export async function handle(request:Request){const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};try{
 const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return new Response(JSON.stringify({error:'Open Home in ION.'}),{status:403,headers});
 const {user}=await getServerUserSession(request),input=schema.parse(await request.json());
 const context=await cloudContext(request,{action:'load',scope:'home',workspaceId:'00000000-0000-4000-8000-000000000000',accessToken:'0'.repeat(64)});
 const stored=Array.isArray(context.row?.nodes)?context.row!.nodes as unknown as CloudNode[]:[];
 const merged=[...new Map([...context.seeds,...stored].map(n=>[n.id,n])).values()].filter(n=>!n.removedBy);
 const catalog=await timeLedger.catalog(user.id),visible=featureClouds(visibleDevClouds(merged,context.isDev),catalog.products,catalog.dev);
 if(!visible.some(n=>n.id===input.id&&n.parentId==='ion'&&n.id!==hiddenFeaturesId))return new Response(JSON.stringify({error:'Choose an available Home feature.'}),{status:404,headers});
 await db.transaction().execute(async tx=>{
  await tx.selectFrom('users').select('id').where('id','=',user.id).forUpdate().executeTakeFirstOrThrow();
  const row=await tx.selectFrom('ionHomePreferences').select('hiddenIds').where('userId','=',user.id).executeTakeFirst(),ids=new Set((Array.isArray(row?.hiddenIds)?row.hiddenIds:[]).filter((v):v is string=>typeof v==='string'));
  if(input.action==='hide')ids.add(input.id);else ids.delete(input.id);
  await tx.insertInto('ionHomePreferences').values({userId:user.id,hiddenIds:[...ids]}).onConflict(c=>c.column('userId').doUpdateSet({hiddenIds:[...ids],updatedAt:new Date()})).execute();
 });
 await Promise.allSettled([publish(channels.cloud('accounts',user.id),{home:true})]);return new Response(JSON.stringify({ok:true}),{headers});
 }catch(e){const status=e instanceof Error&&e.name==='NotAuthenticatedError'?401:e&&typeof e==='object'&&'issues' in e?400:503;return new Response(JSON.stringify({error:status===401?'Sign in to change Home.':'Couldn’t update Home. Try again.'}),{status,headers});}}
