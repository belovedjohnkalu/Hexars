import { sendPushNotifications } from '@floot/push';
import { queueTask } from '@floot/queueTask';
import { sql } from 'kysely';
import { db } from './db';
import { pushSubscription } from '../endpoints/push_POST.schema';
import { notificationRoute } from './notificationRoutes';
// Durable per-event/per-device attempts. Retries reuse the event tag, not a user's last event.
export async function deliverIonNotification({notificationId}:{notificationId:string}){
 const event=await db.selectFrom('ionNotifications').selectAll().where('id','=',notificationId).executeTakeFirst();if(!event)return;
 const payload=event.payload as unknown as {title:string;body:string;tag:string;data:Record<string,unknown>};if(!payload?.data||!notificationRoute(payload.data))return;
 if(event.kind==='shared-game'){
  const share=await db.selectFrom('ionGameShares').select('id').where('id','=',event.sourceId).where('recipientId','=',event.userId).where('revokedAt','is',null).where('recipientHiddenAt','is',null).executeTakeFirst();if(!share)return;
 }
 const devices=await db.selectFrom('ionNotificationDeliveries as d').innerJoin('ionPushSubscriptions as p','p.identityHash','d.identityHash').innerJoin('sessions as s','s.id','p.sessionId').select(['p.identityHash','p.subscription']).where('d.notificationId','=',notificationId).where('d.sentAt','is',null).where('d.attempts','<',3).where('p.userId','=',event.userId).whereRef('s.userId','=','p.userId').where('s.expiresAt','>',new Date()).where('s.credentialExpiresAt','>',new Date()).execute();
 let retry=false;
 for(const device of devices){
  const claimed=await db.updateTable('ionNotificationDeliveries').set({attempts:sql`attempts+1`,leaseUntil:new Date(Date.now()+60000)}).where('notificationId','=',notificationId).where('identityHash','=',device.identityHash).where('sentAt','is',null).where('attempts','<',3).where(e=>e.or([e('leaseUntil','is',null),e('leaseUntil','<',new Date())])).returning('attempts').executeTakeFirst();if(!claimed)continue;
  try{
   const parsed=pushSubscription.safeParse(device.subscription);if(!parsed.success){await db.deleteFrom('ionPushSubscriptions').where('identityHash','=',device.identityHash).execute();continue;}
   const [result]=await sendPushNotifications([parsed.data],{...payload,showWhenFocused:false,ttl:3600});
   if(result?.gone){await db.deleteFrom('ionPushSubscriptions').where('identityHash','=',device.identityHash).execute();continue;}
   if(result?.success)await db.updateTable('ionNotificationDeliveries').set({sentAt:new Date(),leaseUntil:null,lastError:null}).where('notificationId','=',notificationId).where('identityHash','=',device.identityHash).execute();
   else throw new Error('Push provider temporarily unavailable');
  }catch{
   await db.updateTable('ionNotificationDeliveries').set({leaseUntil:null,lastError:'Delivery unavailable'}).where('notificationId','=',notificationId).where('identityHash','=',device.identityHash).execute();
   retry=retry||claimed.attempts<3;
  }
 }
 if(retry)await queueTask('deliverIonNotification',{notificationId},{delayMs:60000,key:'ion_'+notificationId.replace(/[^a-zA-Z0-9_-]/g,'_').slice(-58)});
}
