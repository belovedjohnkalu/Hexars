import { createHash,randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { queueTask } from '@floot/queueTask';
import { publish } from '@floot/realtime';
import { db } from './db';
import { buildPublicBootstrap } from './buildPublicBootstrap';
import { channels } from './realtimeChannels';
import type { Json } from './schema';
import type { PublicBootstrap } from '../endpoints/public_bootstrap_GET.schema';
type Refresh={key:string;origin:string;leaseId:string};
function fingerprint(data:PublicBootstrap) {
  const clean=(value:unknown):unknown=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!['observedAt','buyersObservedAt','version','sizeCharacters','sizeCount','sizeWords'].includes(k)).map(([k,v])=>[k,['imageUrl','imageUrls'].includes(k)?(Array.isArray(v)?v.map(u=>String(u).split('?')[0]):String(v).split('?')[0]):clean(v)])):value;
  // Guest prices/observed clocks are not reasons to wake every Chess visitor.
  return createHash('sha256').update(JSON.stringify(clean({home:data.home,chess:data.chess,labels:data.time.labels}))).digest('hex');
}
async function refresh(input:Refresh) {
  const old=await db.selectFrom('ionPublicSnapshots').select('fingerprint').where('key','=',input.key).where('leaseId','=',input.leaseId).executeTakeFirst();if(!old)return;
  try{
    const data=await buildPublicBootstrap(input.origin),hash=fingerprint(data);
    const saved=await db.updateTable('ionPublicSnapshots').set({payload:data as unknown as Json,fingerprint:hash,validUntil:new Date(Date.now()+15000),leaseId:null,leaseUntil:new Date(0),updatedAt:new Date()}).where('key','=',input.key).where('leaseId','=',input.leaseId).returning('key').executeTakeFirst();
    if(saved&&old.fingerprint&&old.fingerprint!==hash)await Promise.allSettled((['home','chess'] as const).map(scope=>publish(channels.cloud(scope,0),{version:data[scope].version,bootstrap:true})));
    return saved?data:undefined;
  }catch(e){await db.updateTable('ionPublicSnapshots').set({leaseId:null,leaseUntil:new Date(0)}).where('key','=',input.key).where('leaseId','=',input.leaseId).execute();throw e;}
}
async function read(url:string) {
  const u=new URL(url),origin=u.origin,key='ion069:'+u.hostname;
  let row=await db.selectFrom('ionPublicSnapshots').selectAll().where('key','=',key).executeTakeFirst();
  if(row?.payload&&new Date(row.validUntil).getTime()>Date.now())return{data:row.payload as unknown as PublicBootstrap,status:'hit'};
  if(!row){await db.insertInto('ionPublicSnapshots').values({key}).onConflict(oc=>oc.doNothing()).execute();row=await db.selectFrom('ionPublicSnapshots').selectAll().where('key','=',key).executeTakeFirstOrThrow();}
  if(row.leaseId&&new Date(row.leaseUntil).getTime()>Date.now()){
    if(row.payload)return{data:row.payload as unknown as PublicBootstrap,status:'stale'};
    throw Object.assign(new Error('Opening ION. Try again in a moment.'),{status:503});
  }
  const leaseId=randomUUID(),claim=await db.updateTable('ionPublicSnapshots').set({leaseId,leaseUntil:new Date(Date.now()+30000)}).where('key','=',key).where('validUntil','<=',new Date()).where('leaseUntil','<=',new Date()).returning('key').executeTakeFirst();
  if(claim){
    if(!row.payload){const data=await refresh({key,origin,leaseId});if(data)return{data,status:'built'};}
    else try{await queueTask('refreshPublicBootstrap',{key,origin,leaseId});}catch{await db.updateTable('ionPublicSnapshots').set({leaseId:null,leaseUntil:new Date(0)}).where('key','=',key).where('leaseId','=',leaseId).execute();console.error('Public refresh delayed');}
  }
  if(row.payload)return{data:row.payload as unknown as PublicBootstrap,status:'stale'};
  throw Object.assign(new Error('Opening ION. Try again in a moment.'),{status:503});
}
export const publicSnapshotCache={read,refresh,fingerprint};
