import { z } from 'zod';
import { variantSchema,type VariantId } from './game_POST.schema';
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('find'),variant:variantSchema.or(z.literal('random'))}).strict(),
 z.object({action:z.literal('create'),variant:variantSchema}).strict(),
 z.object({action:z.literal('join'),code:z.string().regex(/^\d{4}$/,'Enter four digits.')}).strict(),
 z.object({action:z.literal('get'),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('cancel'),id:z.string().uuid()}).strict()
]);
export type Lobby={id:string;code:string|null;variant:VariantId;status:'waiting'|'playing'|'cancelled';gameId:string|null;players:Array<{seat:number;name:string}>;needed:number};
export async function postOnline(input:z.infer<typeof schema>,signal?:AbortSignal):Promise<Lobby>{const r=await fetch('/_api/online',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input)),signal});const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error||'Couldn’t open this match.'),{status:r.status});return out;}
