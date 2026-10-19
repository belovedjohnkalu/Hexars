import { z } from 'zod';
import type { VariantId } from './game_POST.schema';
export const schema=z.object({timeZone:z.string().max(80).default('UTC')}).strict();
export type HistoryGame={id:string;variant:VariantId;date:string;time:string};
export async function postHistory(timeZone:string,signal?:AbortSignal):Promise<{games:HistoryGame[]}>{const r=await fetch('/_api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timeZone}),signal});const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error||'Couldn’t open History.'),{status:r.status});return out;}
