import {sharedDisplayNames} from './sharedDisplayNames';
import {isPaidFeatureId} from './computerPolicy';
import { workTotals,equalWorkShare } from './workTotals';
import { signedInUserCount } from './signedInUsers';
import { functionIdentifiers } from './functionIdentifiers';
import { receiptClouds } from './functionClouds';
import { sql,type Kysely,type Transaction } from 'kysely';
import { db } from './db';
import type { DB,Json } from './schema';
import { timePrice } from './timeMath';
import type { TimeProduct,TimeReceipt,TimeSnapshot } from '../endpoints/time_POST.schema';
export type TimeDB=Kysely<DB>|Transaction<DB>;
export function timeFail(message:string,status=400,code?:string):never{throw Object.assign(new Error(message),{status,code});}
const wallet=(id:number)=>'user:'+id;
async function roles(userId:number|null,tx:TimeDB=db){if(!userId)return{dev:false,owner:false};const [dev,owner]=await Promise.all([tx.selectFrom('ionDevAccounts').select('userId').where('userId','=',userId).executeTakeFirst(),tx.selectFrom('ionSharedSpaces').select('ownerUserId').where('kind','=','home').where('ownerUserId','=',userId).executeTakeFirst()]);return{dev:!!dev,owner:!!dev&&!!owner};}
async function ensureWallet(tx:TimeDB,userId:number){await tx.insertInto('ionTimeAccounts').values({id:wallet(userId),kind:'user',userId}).onConflict(c=>c.column('id').doNothing()).execute();}
function purchases(tx:TimeDB,userId:number){return tx.selectFrom('ionTimeEntitlements as e').innerJoin('ionTimeTransactions as t','t.id','e.transactionId').select(['e.productId','e.transactionId']).where('e.userId','=',userId).where('t.kind','=','purchase').where('t.actorId','=',userId).where('t.fromAccount','=',wallet(userId)).where('t.toAccount','=','treasury').where(sql<boolean>`t.metadata->>'productId'=e.product_id`).where(sql<boolean>`NOT EXISTS (SELECT 1 FROM ion_time_transactions c WHERE c.kind='correction' AND c.metadata->>'reverses'=t.id::text)`);}
async function catalog(userId:number|null,tx:TimeDB=db){
 const [role,rows,owned,count,config,revenue,account,work]=await Promise.all([
  roles(userId,tx),tx.selectFrom('ionTimeProducts').selectAll().orderBy('id').execute(),
  userId?purchases(tx,userId).execute():Promise.resolve([]),
  signedInUserCount(tx),
  tx.selectFrom('ionTimeConfig').selectAll().where('id','=',true).executeTakeFirstOrThrow(),
  sql<{productId:string;total:string}>`select metadata->>'productId' as product_id,sum(case when kind='purchase' then amount_us else -amount_us end)::text as total from ion_time_transactions where kind in ('purchase','correction') and metadata ? 'productId' group by metadata->>'productId'`.execute(tx),userId?tx.selectFrom('ionTimeAccounts').select('balanceUs').where('userId','=',userId).executeTakeFirst():Promise.resolve(undefined),workTotals(tx)
 ]);
 const readyAt=config.productionStartedAt?new Date(new Date(config.productionStartedAt).getTime()+86400000).toISOString():null,pricingReady=!!readyAt&&Date.parse(readyAt)<=Date.now(),purchased=new Set(owned.map(n=>n.productId)),recovered=new Map(revenue.rows.map(r=>[r.productId,r.total]));
 const activeRows=rows.filter(p=>isPaidFeatureId(p.id));
 const paidFeatures=activeRows.filter(p=>!!p.publishedAt).length;const share=paidFeatures?equalWorkShare(work.totalWorkUs,paidFeatures):null;
 const products:TimeProduct[]=activeRows.map(p=>{const cost=p.publishedAt?share:null;return{id:p.id,kind:p.kind as 'variant'|'engine'|'feature',reference:p.reference,name:p.name,directUs:cost,freeUs:cost===null?null:'0',costUs:cost,proposalId:p.proposalId,pricingModel:'equal-work',totalWorkUs:work.totalWorkUs,paidFeatures,costVersion:'equal-work:'+work.totalWorkUs+':'+paidFeatures,affordable:!!p.publishedAt&&pricingReady&&cost!==null&&count>0&&BigInt(timePrice(cost,count))<=BigInt(account?.balanceUs||'0'),published:!!p.publishedAt,available:false,owned:role.dev||purchased.has(p.id),priceUs:cost!==null&&count?timePrice(cost,count):null,revenueUs:recovered.get(p.id)||'0'};});
 return{...role,products,buyers:count,buyersObservedAt:new Date().toISOString(),readyAt,pricingReady,totalWorkUs:work.totalWorkUs,baselineUs:work.baselineUs,recordedUs:work.recordedUs,paidFeatures,pricingModel:'equal-work' as const};
}
async function snapshot(userId:number|null):Promise<TimeSnapshot>{
 const market=await catalog(userId),labels=await sharedDisplayNames(market.products,market.dev);
 if(!userId)return{...market,labels,userId:null,balanceUs:'0',earnedUs:'0',addedUs:'0',spentUs:'0',observedAt:new Date().toISOString()};
 const [accountResult,user,earned,treasury,identifiers]=await Promise.all([
  sql<{balanceUs:string;addedUs:string;spentUs:string;leaseId:string|null;active:boolean|null;lastSeen:Date|null;idleUntil:Date|null;observedAt:Date}>`select totals.*,e.lease_id,e.active,e.last_seen,e.idle_until,clock_timestamp() as observed_at from (select coalesce(sum(amount_us),0)::text as balance_us,coalesce(sum(amount_us) filter(where amount_us>0),0)::text as added_us,(-coalesce(sum(amount_us) filter(where amount_us<0),0))::text as spent_us from ion_time_entries where account_id=${wallet(userId)}) totals left join ion_time_earning e on e.user_id=${userId}`.execute(db),db.selectFrom('users').select('displayName').where('id','=',userId).executeTakeFirstOrThrow(),
  db.selectFrom('ionTimeTransactions').select(sql<string>`coalesce(sum(amount_us),0)::text`.as('total')).where('toAccount','=',wallet(userId)).where('kind','=','earn').executeTakeFirstOrThrow(),
  market.dev?db.selectFrom('ionTimeAccounts').select('balanceUs').where('id','=','treasury').executeTakeFirst():Promise.resolve(undefined),market.dev?functionIdentifiers(userId):Promise.resolve(undefined)
 ]);
 const account=accountResult.rows[0],earning=account.leaseId&&account.lastSeen&&account.idleUntil?{leaseId:account.leaseId,active:!!account.active,lastSeen:account.lastSeen,idleUntil:account.idleUntil}:null;
 return{...market,labels,userId,playerName:user.displayName,balanceUs:account.balanceUs,addedUs:account.addedUs,spentUs:account.spentUs,observedAt:new Date(account.observedAt).toISOString(),earnedUs:earned.total,...(identifiers?{identifiers}:{}),...(treasury?{treasuryUs:treasury.balanceUs}:{}),...(earning?{earning:{leaseId:earning.leaseId,active:earning.active&&new Date(earning.idleUntil).getTime()>Date.now()&&Date.now()-new Date(earning.lastSeen).getTime()<30000,lastSeen:new Date(earning.lastSeen).toISOString(),idleUntil:new Date(earning.idleUntil).toISOString()}}:{})};
}
async function receipt(tx:TimeDB,id:string,userId:number,withIdentifiers=true):Promise<TimeReceipt>{
 const role=await roles(userId,tx),row=await tx.selectFrom('ionTimeTransactions as t').innerJoin('ionTimeAccounts as a','a.id','t.fromAccount').innerJoin('ionTimeAccounts as b','b.id','t.toAccount').leftJoin('users as u','u.id','a.userId').leftJoin('users as v','v.id','b.userId').select(['t.id','t.kind','t.amountUs','t.createdAt','t.metadata','t.fromAccount','t.toAccount','u.displayName as fromName','v.displayName as toName']).where('t.id','=',id).executeTakeFirst();
 if(!row||(row.fromAccount!==wallet(userId)&&row.toAccount!==wallet(userId)&&!(role.dev&&(row.fromAccount==='treasury'||row.toAccount==='treasury'))))timeFail('This transaction is not available.',404);
 const incoming=row.toAccount===wallet(userId),outgoing=row.fromAccount===wallet(userId),other=incoming?row.fromName||(row.fromAccount==='issuance'?'Active use':'ION treasury'):row.toName||'ION treasury';
 const identifiers=role.dev&&withIdentifiers?await functionIdentifiers(userId,receiptClouds({id:row.id,direction:incoming?'in':outgoing?'out':'none'})):undefined;
 return{...(identifiers?{identifier:identifiers['time-tx-'+row.id],identifiers:Object.fromEntries(Object.entries(identifiers).filter(([key])=>key.startsWith('time-tx-'+row.id)))}:{}),id:row.id,kind:row.kind,amountUs:row.amountUs,direction:incoming?'in':outgoing?'out':'none',other,createdAt:new Date(row.createdAt).toISOString(),metadata:row.metadata&&typeof row.metadata==='object'&&!Array.isArray(row.metadata)?row.metadata as Record<string,unknown>:{}};
}
async function post(tx:TimeDB,input:{id:string;actor:number;key:string;kind:string;from:string;to:string;amount:string;metadata:Record<string,unknown>}){
 const result=await sql<{id:string}>`select ion_time_post(${input.id}::uuid,${input.actor},${input.key},${input.kind},${input.from},${input.to},${input.amount}::bigint,${input.metadata as Json}::jsonb) as id`.execute(tx);return result.rows[0].id;
}
export const timeLedger={wallet,roles,ensureWallet,purchases,catalog,snapshot,receipt,post};
