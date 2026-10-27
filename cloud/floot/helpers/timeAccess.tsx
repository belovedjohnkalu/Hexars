import {timeEntitlements} from './timeEntitlements';
import {chessVariants} from './chessVariants';
import {isFreeVariant} from './computerPolicy';
import { db } from './db';
import { timeLedger,timeFail } from './timeLedger';
import type { TimeDB } from './timeLedger';
export function timeRequired(variant:string,engine?:string){return isFreeVariant(variant)?[]:['variant:'+variant];}
async function assert(userId:number|null,variant:string,engine?:string,tx:TimeDB=db){const required=timeRequired(variant,engine);if(!required.length)return;const access=await timeEntitlements.read(userId,tx);if(access.dev)return;const missing=required.filter(id=>!access.owned.includes(id));if(missing.length)timeFail('Unlock this variant in Time to play.',402,'TIME_UNLOCK_REQUIRED');}
async function variants(userId:number|null,tx:TimeDB=db){const access=await timeEntitlements.read(userId,tx);return chessVariants.all.filter(v=>isFreeVariant(v.id)||access.dev||access.owned.includes('variant:'+v.id)).map(v=>v.id);}
async function feature(userId:number|null,id:string){const market=await timeLedger.catalog(userId);if(!market.dev&&!market.products.some(p=>p.id===id&&p.owned))timeFail('Purchase Schedule in Time to open it.',402,'TIME_UNLOCK_REQUIRED');}
export const timeAccess={assert,variants,feature};
