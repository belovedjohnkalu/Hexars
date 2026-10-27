import {cacheRead} from '../helpers/cacheRead';
import { z } from 'zod';
const amount=z.string().regex(/^(0|[1-9]\d{0,17})$/),uuid=z.string().uuid();
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('snapshot')}),
 z.object({action:z.literal('work'),operation:z.enum(['list','start','stop','correct','baseline']),id:uuid.optional(),description:z.string().trim().min(1).max(500).optional(),startedAt:z.string().datetime().optional(),endedAt:z.string().datetime().optional(),expectedUpdatedAt:z.string().datetime().optional(),durationUs:amount.optional(),basis:z.string().trim().min(1).max(4000).optional(),requestId:uuid.optional(),before:z.string().datetime().optional()}),
 z.object({action:z.literal('activity'),treasury:z.boolean().optional(),direction:z.enum(['in','out']).optional(),receivedOnly:z.boolean().optional(),purchasesOnly:z.boolean().optional(),before:z.object({at:z.string().datetime(),id:uuid}).optional()}),
 z.object({action:z.literal('receipt'),id:uuid}),
 z.object({action:z.literal('earning'),operation:z.enum(['claim','heartbeat','stop']),leaseId:uuid,sequence:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),idleAgeMs:z.number().int().min(0).max(86400000)}),
 z.object({action:z.literal('quote'),kind:z.enum(['purchase','transfer','payout']),productId:z.string().max(80).optional(),playerName:z.string().trim().min(1).max(40).optional(),amountUs:amount.optional()}),
 z.object({action:z.literal('confirm'),quoteId:uuid,requestId:uuid}),
 z.object({action:z.literal('propose'),productId:z.string().max(80),durationUs:amount,basis:z.string().trim().min(1).max(4000),requestId:uuid}),
 z.object({action:z.literal('approve'),proposalId:uuid}),
 z.object({action:z.literal('administration')})
]);
export type TimeInput=z.infer<typeof schema>;
export type TimeProduct={id:string;kind:'variant'|'engine'|'feature';reference:string;name:string;directUs:string|null;freeUs:string|null;costUs:string|null;priceUs:string|null;affordable?:boolean;proposalId?:string|null;costVersion?:string;totalWorkUs?:string;paidFeatures?:number;pricingModel?:'equal-work';published:boolean;available:boolean;owned:boolean;revenueUs:string};
export type TimeReceipt={id:string;kind:string;amountUs:string;direction:'in'|'out'|'none';other:string;createdAt:string;metadata:Record<string,unknown>;identifier?:string;identifiers?:Record<string,string>};
export type TimeSnapshot={buyersObservedAt?:string;labels?:Record<string,string>;userId:number|null;dev:boolean;owner:boolean;playerName?:string;balanceUs:string;earnedUs:string;addedUs?:string;spentUs?:string;observedAt?:string;identifiers?:Record<string,string>;buyers:number;readyAt:string|null;pricingReady:boolean;products:TimeProduct[];totalWorkUs?:string;baselineUs?:string;recordedUs?:string;paidFeatures?:number;pricingModel?:'equal-work';treasuryUs?:string;earning?:{leaseId:string;active:boolean;lastSeen:string;idleUntil:string}};
export type TimeQuote={id:string;kind:'purchase'|'transfer'|'payout';amountUs:string;recipient?:string;productId?:string;productName?:string;buyers?:number;expiresAt:string};
export type TimeAdministration={proposals:Array<{id:string;productId:string;durationUs:string;basis:string;author:string;createdAt:string}>;freeCostUs:string|null;freeProposalId?:string|null;treasuryUs:string;};
export type WorkSession={id:string;description:string;source:'manual'|'agent';startedAt:string;endedAt:string|null;updatedAt:string;by:string;durationUs:string;canEdit:boolean};
export type WorkState={totalWorkUs:string;baselineUs:string;recordedUs:string;basis:string;updatedAt:string;sessions:WorkSession[];active:WorkSession|null;next:string|null;identifiers?:Record<string,string>};
export type TimeResult={offline?:boolean;work?:WorkState;snapshot?:TimeSnapshot;quote?:TimeQuote;receipt?:TimeReceipt;activity?:TimeReceipt[];next?:{at:string;id:string}|null;administration?:TimeAdministration;earning?:{active:boolean;elsewhere:boolean;creditedUs:string};ok?:boolean};
async function fetchTime(input:TimeInput,signal?:AbortSignal):Promise<TimeResult>{const response=await fetch('/_api/time',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input)),signal});const data=await response.json().catch(()=>null);if(!response.ok||!data)throw Object.assign(new Error(data?.error||'Couldn’t reach Time. Try again.'),{status:response.status,code:data?.code});return data;}

export async function postTime(input:TimeInput,signal?:AbortSignal):Promise<TimeResult>{const read=['snapshot','activity','receipt','administration'].includes(input.action)||input.action==='work'&&input.operation==='list';return read?cacheRead('time:'+JSON.stringify(input),()=>fetchTime(input,signal)):fetchTime(input,signal);}
