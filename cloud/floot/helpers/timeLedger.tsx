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
async function catalog(userId:number|null,tx:TimeDB=db){
 const [role,rows,owned,count,config,revenue]=await Promise.all([
  roles(userId,tx),tx.selectFrom('ionTimeProducts').selectAll().orderBy('id').execute(),
  userId?tx.selectFrom('ionTimeEntitlements').select('productId').where('userId','=',userId).execute():Promise.resolve([]),
  tx.selectFrom('sessions').select(sql<number>`count(distinct user_id)::int`.as('buyers')).where('credentialExpiresAt','>',new Date()).executeTakeFirstOrThrow(),
  tx.selectFrom('ionTimeConfig').selectAll().where('id','=',true).executeTakeFirstOrThrow(),
  sql<{productId:string;total:string}>`select metadata->>'productId' as product_id,sum(case when kind='purchase' then amount_us else -amount_us end)::text as total from ion_time_transactions where kind in ('purchase','correction') and metadata ? 'productId' group by metadata->>'productId'`.execute(tx)
 ]);
 const readyAt=config.productionStartedAt?new Date(new Date(config.productionStartedAt).getTime()+86400000).toISOString():null,pricingReady=!!readyAt&&Date.parse(readyAt)<=Date.now(),purchased=new Set(owned.map(n=>n.productId)),recovered=new Map(revenue.rows.map(r=>[r.productId,r.total]));
 const products:TimeProduct[]=rows.map(p=>{const cost=p.directUs!==null&&p.freeUs!==null?(BigInt(p.directUs)+BigInt(p.freeUs)).toString():null;return{id:p.id,kind:p.kind as 'variant'|'engine',reference:p.reference,name:p.name,directUs:p.directUs,freeUs:p.freeUs,costUs:cost,published:!!p.publishedAt,available:!p.publishedAt||!pricingReady,owned:role.dev||purchased.has(p.id),priceUs:cost!==null&&count.buyers?timePrice(cost,count.buyers):null,revenueUs:recovered.get(p.id)||'0'};});
 return{...role,products,buyers:count.buyers,readyAt,pricingReady};
}
async function snapshot(userId:number|null):Promise<TimeSnapshot>{
 const market=await catalog(userId);
 if(!userId)return{...market,userId:null,balanceUs:'0',earnedUs:'0'};
 const [account,user,earned,earning,treasury]=await Promise.all([
  db.selectFrom('ionTimeAccounts').select('balanceUs').where('id','=',wallet(userId)).executeTakeFirst(),db.selectFrom('users').select('displayName').where('id','=',userId).executeTakeFirstOrThrow(),
  db.selectFrom('ionTimeTransactions').select(sql<string>`coalesce(sum(amount_us),0)::text`.as('total')).where('toAccount','=',wallet(userId)).where('kind','=','earn').executeTakeFirstOrThrow(),
  db.selectFrom('ionTimeEarning').selectAll().where('userId','=',userId).executeTakeFirst(),market.dev?db.selectFrom('ionTimeAccounts').select('balanceUs').where('id','=','treasury').executeTakeFirst():Promise.resolve(undefined)
 ]);
 return{...market,userId,playerName:user.displayName,balanceUs:account?.balanceUs||'0',earnedUs:earned.total,...(treasury?{treasuryUs:treasury.balanceUs}:{}),...(earning?{earning:{leaseId:earning.leaseId,active:earning.active&&new Date(earning.idleUntil).getTime()>Date.now()&&Date.now()-new Date(earning.lastSeen).getTime()<30000,lastSeen:new Date(earning.lastSeen).toISOString(),idleUntil:new Date(earning.idleUntil).toISOString()}}:{})};
}
async function receipt(tx:TimeDB,id:string,userId:number):Promise<TimeReceipt>{
 const role=await roles(userId,tx),row=await tx.selectFrom('ionTimeTransactions as t').innerJoin('ionTimeAccounts as a','a.id','t.fromAccount').innerJoin('ionTimeAccounts as b','b.id','t.toAccount').leftJoin('users as u','u.id','a.userId').leftJoin('users as v','v.id','b.userId').select(['t.id','t.kind','t.amountUs','t.createdAt','t.metadata','t.fromAccount','t.toAccount','u.displayName as fromName','v.displayName as toName']).where('t.id','=',id).executeTakeFirst();
 if(!row||(row.fromAccount!==wallet(userId)&&row.toAccount!==wallet(userId)&&!(role.dev&&(row.fromAccount==='treasury'||row.toAccount==='treasury'))))timeFail('This transaction is not available.',404);
 const incoming=row.toAccount===wallet(userId),outgoing=row.fromAccount===wallet(userId),other=incoming?row.fromName||(row.fromAccount==='issuance'?'Active use':'ION treasury'):row.toName||'ION treasury';
 return{id:row.id,kind:row.kind,amountUs:row.amountUs,direction:incoming?'in':outgoing?'out':'none',other,createdAt:new Date(row.createdAt).toISOString(),metadata:row.metadata&&typeof row.metadata==='object'&&!Array.isArray(row.metadata)?row.metadata as Record<string,unknown>:{}};
}
async function post(tx:TimeDB,input:{id:string;actor:number;key:string;kind:string;from:string;to:string;amount:string;metadata:Record<string,unknown>}){
 const result=await sql<{id:string}>`select ion_time_post(${input.id}::uuid,${input.actor},${input.key},${input.kind},${input.from},${input.to},${input.amount}::bigint,${input.metadata as Json}::jsonb) as id`.execute(tx);return result.rows[0].id;
}
export const timeLedger={wallet,roles,ensureWallet,catalog,snapshot,receipt,post};
