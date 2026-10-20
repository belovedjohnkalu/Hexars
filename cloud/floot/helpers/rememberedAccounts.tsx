import { createHash } from 'node:crypto';
import { db } from './db';
export async function rememberedAccounts(request:Request){
 const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ion_device='))?.slice('ion_device='.length)||'';
 if(!token)return [];
 const hash=createHash('sha256').update(token).digest('hex'),now=new Date();
 return db.selectFrom('ionDeviceAccounts').innerJoin('ionRememberedDevices','ionDeviceAccounts.deviceHash','ionRememberedDevices.tokenHash').innerJoin('sessions','ionDeviceAccounts.sessionId','sessions.id').innerJoin('users','ionDeviceAccounts.userId','users.id').select(['users.id','users.email','users.displayName','sessions.id as sessionId']).whereRef('sessions.userId','=','ionDeviceAccounts.userId').where('deviceHash','=',hash).where('ionRememberedDevices.expiresAt','>',now).where('sessions.expiresAt','>',now).execute();
}
