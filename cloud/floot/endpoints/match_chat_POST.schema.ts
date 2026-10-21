import { z } from 'zod';
export const schema=z.object({gameId:z.string().uuid(),id:z.string().uuid(),text:z.string().trim().min(1).max(240)}).strict();
export type ChatWord={gameId:string;id:string;text:string;name:string;seat:number;expiresAt:number;identifier?:string};
export type InputType=z.infer<typeof schema>;
export type OutputType={sent:true;message:ChatWord};
export async function postMatchChat(body:InputType,signal?:AbortSignal):Promise<OutputType>{
 const response=await fetch('/_api/match_chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(body)),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
 const value=await response.json();if(!response.ok)throw Object.assign(new Error(value.error||'Message not sent. Try again.'),{status:response.status});return value;
}
