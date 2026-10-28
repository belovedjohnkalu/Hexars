import {communityIL} from '../helpers/communityIL';
import {db} from '../helpers/db';
import {optionalGameUser} from '../helpers/gameAccess';
import {cloudILLocation,resolveCloudIL} from '../helpers/cloudILNavigation';
import {handle as loadHistory} from './history_POST';
import {featureClouds} from '../helpers/featureClouds';
import {timeLedger} from '../helpers/timeLedger';
import {cloudURL} from '../helpers/cloudRoutes';
import {lookupILNodeIds,indexedILScopes} from '../helpers/cloudILLocationIndex';
import {dynamicTimeId} from '../helpers/dynamicTimeId';
import {timePageCloud} from '../helpers/timePageClouds';
import type {CloudScope,OutputType} from './cloud_POST.schema';
import {cloudService as loadCloud} from '../helpers/cloudService';
import {schema,type ILItem} from './il_POST.schema';
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store'};
const credentials={workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64)};
function fail(message:string,status=404):never{throw Object.assign(new Error(message),{status});}
export async function handle(request:Request){try{
 const raw=await request.text();if(raw.length>10000)fail('Search is too long.',413);const input=schema.parse(JSON.parse(raw));
 // Reuse the ordinary cloud response: authentication, personal ownership,
 // hidden dev content and paid-feature discovery are identical to navigation.
 const snapshot=async(scope:CloudScope,targetId?:string):Promise<OutputType|null>=>{const id=targetId?.replace(/^function-u\d+:/,''),functionalId=id&&(dynamicTimeId(id)||timePageCloud(id))?id:undefined;const r=await loadCloud(new Request(new URL('/_api/cloud',request.url),{method:'POST',headers:{'Content-Type':'application/json',cookie:request.headers.get('cookie')||''},body:JSON.stringify({action:'load',scope,...credentials,...(functionalId?{functionalId}:{})}),signal:request.signal}));return r.ok?await r.json():null;};
 if(input.action==='search'){
  const publicCloud=await snapshot('public');if(!publicCloud)fail('Safari search is unavailable. Try again.',503);
  const query=input.query.toLocaleLowerCase(),items=publicCloud.nodes.filter(n=>n.name.toLocaleLowerCase().includes(query)||n.identifier?.toLocaleLowerCase().includes(query)).map(n=>({id:n.id,name:n.name,il:n.identifier!,scope:'public' as const,url:cloudILLocation(n,'public')})).filter(n=>!!n.il);
  const pages=Math.ceil(items.length/2),page=Math.min(input.page,Math.max(0,pages-1));return new Response(JSON.stringify({items:items.slice(page*2,page*2+2),page,pages,total:items.length}),{headers});
 }
 const discussion=await communityIL(input.il);if(discussion)return new Response(JSON.stringify({items:[discussion],page:0,pages:1,total:1}),{headers});
 const found=await resolveCloudIL(input.il,{
  viewerNamespace:async()=>{const user=await optionalGameUser(request);return user?(await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',user.id).executeTakeFirst())?.devNumber:undefined;},
  lookup:lookupILNodeIds,
  locations:async ids=>indexedILScopes(ids,(await optionalGameUser(request))?.id??null),
  homeNamespace:async()=>(await db.selectFrom('ionSharedSpaces').innerJoin('ionDevAccounts','ionDevAccounts.userId','ionSharedSpaces.ownerUserId').select('devNumber').where('kind','=','home').executeTakeFirst())?.devNumber,
  load:async(scope,id)=>{const view=await snapshot(scope,id);if(scope!=='chess'||!view?.userId||view.nodes.some(n=>n.id===id)||id?.startsWith('function-u'))return view;const response=await loadHistory(new Request(new URL('/_api/history',request.url),{method:'POST',headers:{'Content-Type':'application/json',cookie:request.headers.get('cookie')||''},body:JSON.stringify({timeZone:'UTC'}),signal:request.signal}));if(response.ok){const history=await response.json(),market=await timeLedger.catalog(view.userId);view.nodes=featureClouds([...view.nodes,...history.nodes],market.products,market.dev);}return view;}
 });
 if(!found)fail('This IL isn’t available.');return new Response(JSON.stringify({items:[found],page:0,pages:1,total:1}),{headers});
 }catch(e){const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;return new Response(JSON.stringify({error:status===503?'Search is unavailable. Try again.':e instanceof Error?e.message:'This IL isn’t available.'}),{status,headers});}}
