import { db } from './db';
import { timeLedger,timeFail } from './timeLedger';
import type { TimeDB } from './timeLedger';
export function timeRequired(variant:string,engine?:string){return[...(variant==='glinski'?[]:['variant:'+variant]),...(engine&&engine!=='universal'?['engine:'+engine]:[])];}
async function assert(userId:number|null,variant:string,engine?:string,tx:TimeDB=db){const required=timeRequired(variant,engine);if(!required.length)return;const market=await timeLedger.catalog(userId,tx);if(market.dev)return;const missing=required.filter(id=>!market.products.some(p=>p.id===id&&p.owned));if(missing.length)timeFail('Unlock '+missing.map(id=>market.products.find(p=>p.id===id)?.name||'this feature').join(' and ')+' in Time to play.',402,'TIME_UNLOCK_REQUIRED');}
async function variants(userId:number|null,tx:TimeDB=db){const market=await timeLedger.catalog(userId,tx);return['glinski',...market.products.filter(p=>p.kind==='variant'&&(market.dev||p.owned)).map(p=>p.reference)];}
export const timeAccess={assert,variants};
