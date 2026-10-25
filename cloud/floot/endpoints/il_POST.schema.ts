import {z} from 'zod';
import {normalizeIL,validIL} from '../helpers/cloudIL';
import type {CloudScope} from './cloud_POST.schema';
const identifier=z.string().trim().max(4096).transform(normalizeIL).refine(validIL,'Enter an IL, such as IL01.');
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('resolve'),il:identifier}).strict(),
 z.object({action:z.literal('search'),query:z.string().trim().min(1).max(4096),page:z.number().int().nonnegative().default(0)}).strict()
]);
export type ILItem={id:string;name:string;il:string;scope:CloudScope;url:string};
export type ILResult={items:ILItem[];page:number;pages:number;total:number};
export async function postIL(input:z.input<typeof schema>,signal?:AbortSignal):Promise<ILResult>{const r=await fetch('/_api/il',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input)),signal});const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error||'Couldn’t find that cloud.'),{status:r.status});return out;}
