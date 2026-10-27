import { db } from './db';
import { signedInUserCount } from './signedInUsers';
import { publish } from '@floot/realtime';
import { channels } from './realtimeChannels';
export async function announceSignedInUsers(payload:{leaseId:string}) {
  // A short event-triggered batch, not a recurring poll. Release BEFORE reading
  // the count so a later sign-in can schedule the next complete observation.
  await new Promise(resolve=>setTimeout(resolve,2000));
  const own=await db.updateTable('ionCatalogSignal').set({leaseId:null,leaseUntil:new Date(0)}).where('id','=',true).where('leaseId','=',payload.leaseId).returning('id').executeTakeFirst();
  if(own)await publish(channels.timeCatalog,{buyers:await signedInUserCount(),buyersObservedAt:new Date().toISOString()});
}
