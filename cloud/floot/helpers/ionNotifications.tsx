import { queueTask } from '@floot/queueTask';
import type { Transaction } from 'kysely';
import { db } from './db';
import type { DB,Json } from './schema';
import { deliverIonNotification } from './deliverIonNotification';
export type IonNotice={id:string;userId:number;kind:'time-sent'|'time-received'|'shared-game';sourceId:string;payload:{title:string;body:string;tag:string;data:{route:string;userId:number}}};
export const ionNotifications={
 async record(tx:Transaction<DB>,notice:IonNotice){
  const devices=await tx.selectFrom('ionPushSubscriptions as p').innerJoin('sessions as s','s.id','p.sessionId').select('p.identityHash').where('p.userId','=',notice.userId).whereRef('s.userId','=','p.userId').where('s.expiresAt','>',new Date()).where('s.credentialExpiresAt','>',new Date()).execute();
  if(!devices.length)return;
  await tx.insertInto('ionNotifications').values({...notice,payload:notice.payload as unknown as Json}).onConflict(c=>c.column('id').doNothing()).execute();
  await tx.insertInto('ionNotificationDeliveries').values(devices.map(d=>({notificationId:notice.id,identityHash:d.identityHash}))).onConflict(c=>c.columns(['notificationId','identityHash']).doNothing()).execute();
 },
 async dispatch(sourceId:string){
  const rows=await db.selectFrom('ionNotifications').select('id').where('sourceId','=',sourceId).execute();
  for(const row of rows){try{await queueTask('deliverIonNotification',{notificationId:row.id});}catch{try{await deliverIonNotification({notificationId:row.id});}catch{console.error('Notification delivery delayed');}}}
 }
};
