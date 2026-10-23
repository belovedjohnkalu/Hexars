import { z } from 'zod';
const token=z.string().min(8).max(8192);
export const pushSubscription=z.union([
 z.object({endpoint:z.string().url().max(8192).refine(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&/^(?:[a-z0-9-]+\.)*(?:push\.apple\.com|push\.services\.mozilla\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|notify\.windows\.com)$/.test(u.hostname); }catch{return false;}},'Unsupported push provider.'),expirationTime:z.number().nullable().optional(),keys:z.object({p256dh:token,auth:token})}),
 z.object({fcmToken:token,platform:z.enum(['android','ios'])}),z.object({apnsToken:token,platform:z.literal('ios')})
]);
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('save'),accountId:z.number().int().positive(),subscription:pushSubscription}),
 z.object({action:z.literal('status'),accountId:z.number().int().positive(),identity:token}),
 z.object({action:z.literal('remove'),accountId:z.number().int().positive(),identity:token.optional()})
]);
export async function postPush(input:z.infer<typeof schema>){const r=await fetch('/_api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input))});const value=await r.json();if(!r.ok)throw new Error(value.error||'Couldn’t update notifications. Try again.');return value;}
