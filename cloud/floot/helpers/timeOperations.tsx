import { functionIdentifiers } from './functionIdentifiers';
import { receiptClouds } from './functionClouds';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './db';
import { timeLedger,timeFail } from './timeLedger';
import { timeAmount,timeCredit,timeFreeAllocation,timePrice } from './timeMath';
import type { TimeInput,TimeQuote,TimeResult } from '../endpoints/time_POST.schema';
const when=(d:Date|string)=>new Date(d).toISOString();
export async function timeOperations(input:Exclude<TimeInput,{action:'snapshot'}>,userId:number,sessionId:string):Promise<TimeResult>{
 if(input.action==='receipt')return{receipt:await timeLedger.receipt(db,input.id,userId)};
 if(input.action==='activity'){
  if(input.treasury&&!(await timeLedger.roles(userId)).dev)timeFail('Dev accounts only.',403);
  const account=input.treasury?'treasury':timeLedger.wallet(userId);
  let query=db.selectFrom('ionTimeTransactions').select(['id','createdAt']).where(e=>e.or([e('fromAccount','=',account),e('toAccount','=',account)]));
  if(input.direction)query=query.where(input.direction==='in'?'toAccount':'fromAccount','=',account);
  if(input.receivedOnly)query=query.where('toAccount','=',account).where('kind','in',['transfer','payout']);
  if(input.before)query=query.where(e=>e.or([e('createdAt','<',new Date(input.before!.at)),e.and([e('createdAt','=',new Date(input.before!.at)),e('id','<',input.before!.id)])]));
  const rows=await query.orderBy('createdAt','desc').orderBy('id','desc').limit(13).execute(),page=rows.slice(0,12),last=page.at(-1);
  const activity=await Promise.all(page.map(r=>timeLedger.receipt(db,r.id,userId,false))),identifiers=await functionIdentifiers(userId,activity.flatMap(receiptClouds));
  return{activity:activity.map(r=>({...r,...(identifiers?{identifier:identifiers['time-tx-'+r.id]}:{})})),next:rows.length>12&&last?{at:when(last.createdAt),id:last.id}:null};
 }
 if(input.action==='administration'){
  if(!(await timeLedger.roles(userId)).dev)timeFail('Only dev accounts can open these records.',403);
  const [proposals,config,treasury]=await Promise.all([
   db.selectFrom('ionTimeCostProposals as p').innerJoin('users','users.id','p.authorId').select(['p.id','p.productId','p.durationUs','p.basis','users.displayName as author','p.createdAt']).orderBy('p.createdAt','desc').limit(100).execute(),
   db.selectFrom('ionTimeConfig').leftJoin('ionTimeCostProposals','ionTimeCostProposals.id','ionTimeConfig.freeProposalId').select(['durationUs','ionTimeConfig.freeProposalId']).where('ionTimeConfig.id','=',true).executeTakeFirst(),
   db.selectFrom('ionTimeAccounts').select('balanceUs').where('id','=','treasury').executeTakeFirstOrThrow()
  ]);return{administration:{proposals:proposals.map(p=>({...p,createdAt:when(p.createdAt)})),freeCostUs:config?.durationUs??null,freeProposalId:config?.freeProposalId??null,treasuryUs:treasury.balanceUs}};
 }
 if(input.action==='propose'){
  if(!(await timeLedger.roles(userId)).dev)timeFail('Only dev accounts can submit estimates.',403);
  timeAmount(input.durationUs,true);
  if(input.productId!=='free-work'&&!await db.selectFrom('ionTimeProducts').select('id').where('id','=',input.productId).executeTakeFirst())timeFail('Choose a feature.');
  const old=await db.selectFrom('ionTimeCostProposals').selectAll().where('id','=',input.requestId).executeTakeFirst();
  if(old){if(old.authorId!==userId||old.productId!==input.productId||old.durationUs!==input.durationUs||old.basis!==input.basis)timeFail('This request was already used.',409);return{ok:true};}
  await db.insertInto('ionTimeCostProposals').values({id:input.requestId,productId:input.productId,durationUs:input.durationUs,basis:input.basis,authorId:userId}).execute();return{ok:true};
 }
 if(input.action==='approve'){
  if(!(await timeLedger.roles(userId)).owner)timeFail('Only ION’s owner can publish costs.',403);
  await db.transaction().execute(async tx=>{
   const config=await tx.selectFrom('ionTimeConfig').selectAll().where('id','=',true).forUpdate().executeTakeFirstOrThrow();
   const proposal=await tx.selectFrom('ionTimeCostProposals').selectAll().where('id','=',input.proposalId).executeTakeFirstOrThrow();
   if(proposal.productId==='free-work'){
    if(config.freeProposalId===proposal.id)return;
    const products=await tx.selectFrom('ionTimeProducts').selectAll().orderBy('id').forUpdate().execute();
    const allocated=timeFreeAllocation(proposal.durationUs,products.map(p=>p.id));
    for(const product of products.filter(p=>p.publishedAt)){
     const after={...product,freeUs:allocated.get(product.id)!};
     await sql`insert into ion_time_cost_revisions(id,product_id,proposal_id,actor_id,before_cost,after_cost) values(${randomUUID()}::uuid,${product.id},${proposal.id}::uuid,${userId},${JSON.stringify(product)}::jsonb,${JSON.stringify(after)}::jsonb)`.execute(tx);
     await tx.updateTable('ionTimeProducts').set({freeUs:after.freeUs}).where('id','=',product.id).execute();
    }
    await sql`insert into ion_time_cost_revisions(id,product_id,proposal_id,actor_id,before_cost,after_cost) values(${randomUUID()}::uuid,'free-work',${proposal.id}::uuid,${userId},${JSON.stringify({proposalId:config.freeProposalId})}::jsonb,${JSON.stringify({proposalId:proposal.id,durationUs:proposal.durationUs})}::jsonb)`.execute(tx);
    await tx.updateTable('ionTimeConfig').set({freeProposalId:proposal.id}).where('id','=',true).execute();return;
   }
   const product=await tx.selectFrom('ionTimeProducts').selectAll().where('id','=',proposal.productId).forUpdate().executeTakeFirstOrThrow();
   if(product.proposalId===proposal.id)return;
   if(!config.freeProposalId)timeFail('Approve the free-work estimate first.');
   const free=await tx.selectFrom('ionTimeCostProposals').select('durationUs').where('id','=',config.freeProposalId).executeTakeFirstOrThrow(),all=await tx.selectFrom('ionTimeProducts').select('id').execute();
   const allocated=timeFreeAllocation(free.durationUs,all.map(p=>p.id));
   const after={directUs:proposal.durationUs,freeUs:allocated.get(product.id)!,proposalId:proposal.id,approvedBy:userId,publishedAt:new Date()};
   await sql`insert into ion_time_cost_revisions(id,product_id,proposal_id,actor_id,before_cost,after_cost) values(${randomUUID()}::uuid,${product.id},${proposal.id}::uuid,${userId},${JSON.stringify(product)}::jsonb,${JSON.stringify(after)}::jsonb)`.execute(tx);
   await tx.updateTable('ionTimeProducts').set(after).where('id','=',product.id).execute();
  });return{ok:true};
 }
 if(input.action==='earning')return db.transaction().execute(async tx=>{
  await sql`select pg_advisory_xact_lock(hashtextextended(${`time-earning:${userId}`},0))`.execute(tx);
  const old=await tx.selectFrom('ionTimeEarning').selectAll().where('userId','=',userId).forUpdate().executeTakeFirst(),now=new Date(),idleUntil=new Date(now.getTime()+Math.max(0,180000-input.idleAgeMs));
  if(input.operation==='claim'){
   if(input.idleAgeMs>=180000)return{earning:{active:false,elsewhere:false,creditedUs:'0'}};
   if(old?.leaseId===input.leaseId&&old.sessionId===sessionId&&BigInt(input.sequence)<=BigInt(old.sequence))return{earning:{active:old.active,elsewhere:false,creditedUs:'0'}};
   await tx.insertInto('ionTimeEarning').values({userId,sessionId,leaseId:input.leaseId,sequence:input.sequence,lastSeen:now,idleUntil,active:true}).onConflict(c=>c.column('userId').doUpdateSet({sessionId,leaseId:input.leaseId,sequence:input.sequence,lastSeen:now,idleUntil,active:true})).execute();return{earning:{active:true,elsewhere:false,creditedUs:'0'}};
  }
  if(!old||old.leaseId!==input.leaseId||old.sessionId!==sessionId)return{earning:{active:false,elsewhere:true,creditedUs:'0'}};
  if(BigInt(input.sequence)<=BigInt(old.sequence))return{earning:{active:old.active,elsewhere:false,creditedUs:'0'}};
  const credit=timeCredit(new Date(old.lastSeen).getTime(),now.getTime(),new Date(old.idleUntil).getTime(),old.active);
  if(credit>0){await timeLedger.ensureWallet(tx,userId);await timeLedger.post(tx,{id:randomUUID(),actor:userId,key:'earn:'+input.leaseId+':'+input.sequence,kind:'earn',from:'issuance',to:timeLedger.wallet(userId),amount:credit.toString(),metadata:{label:'Active use'}});}
  const active=input.operation!=='stop'&&input.idleAgeMs<180000;
  await tx.updateTable('ionTimeEarning').set({lastSeen:now,idleUntil,sequence:input.sequence,active}).where('userId','=',userId).execute();
  return{earning:{active,elsewhere:false,creditedUs:credit.toString()}};
 });
 if(input.action==='quote'){
  const now=Date.now(),id=randomUUID(),expiresAt=new Date(now+30000);let quote:TimeQuote;
  if(input.kind==='purchase'){
   const market=await timeLedger.catalog(userId),product=market.products.find(p=>p.id===input.productId);
   if(!product)timeFail('Choose a feature.');if(product.owned)timeFail('You already have access to this feature.',409);
   if(!product.published||!market.pricingReady)timeFail('This feature’s price is being prepared.',409);
   if(product.priceUs===null||market.buyers<1)timeFail('Sign in again to see a price.',401);
   quote={id,kind:'purchase',amountUs:product.priceUs,productId:product.id,productName:product.name,buyers:market.buyers,expiresAt:expiresAt.toISOString()};
   const source=product;
  await db.insertInto('ionTimeQuotes').values({id,actorId:userId,kind:'purchase',productId:quote.productId!,amountUs:quote.amountUs,buyers:quote.buyers!,expiresAt,calculation:{creationCostUs:(BigInt(source.directUs!)+BigInt(source.freeUs!)).toString(),directUs:source.directUs,freeUs:source.freeUs,costVersion:source.proposalId}}).execute();return{quote};
  }else{
   if(input.kind==='payout'&&!(await timeLedger.roles(userId)).owner)timeFail('Only ION’s owner can make payouts.',403);
   if(!input.playerName||!input.amountUs)timeFail('Enter a player name and amount.');timeAmount(input.amountUs);
   const target=await db.selectFrom('users').leftJoin('ionTimeAccounts','ionTimeAccounts.userId','users.id').select(['users.id','users.displayName']).where(sql`lower(btrim(display_name))`,'=',input.playerName.trim().toLowerCase()).where(sql<boolean>`ion_time_accounts.closed_at is null`).executeTakeFirst();
   if(!target)timeFail('No account has that player name.');if(target.id===userId&&input.kind==='transfer')timeFail('Choose another player.');
   const source=await db.selectFrom('ionTimeAccounts').select('balanceUs').where('id','=',input.kind==='payout'?'treasury':timeLedger.wallet(userId)).executeTakeFirst();if(BigInt(source?.balanceUs||'0')<BigInt(input.amountUs))timeFail('Not enough Time.',409);
   quote={id,kind:input.kind,amountUs:input.amountUs,recipient:target.displayName,expiresAt:expiresAt.toISOString()};
   await db.insertInto('ionTimeQuotes').values({id,actorId:userId,kind:input.kind,recipientId:target.id,amountUs:input.amountUs,expiresAt}).execute();return{quote};
  }

 }
 if(input.action==='confirm'){
  const transactionId=await db.transaction().execute(async tx=>{
   const quote=await tx.selectFrom('ionTimeQuotes').selectAll().where('id','=',input.quoteId).where('actorId','=',userId).forUpdate().executeTakeFirst();
   if(!quote)timeFail('This confirmation is not available.',404);
   if(quote.usedTransactionId)return quote.usedTransactionId;
   if(new Date(quote.expiresAt).getTime()<=Date.now())timeFail('This price expired. Review it again.',409,'QUOTE_EXPIRED');
   const key='confirm:'+input.requestId;
   await sql`select pg_advisory_xact_lock(hashtextextended(${`time-confirm:${userId}:${input.requestId}`},0))`.execute(tx);
   const reused=await tx.selectFrom('ionTimeTransactions').select(['id','metadata']).where('actorId','=',userId).where('requestKey','=',key).executeTakeFirst();
   if(reused){if(!reused.metadata||typeof reused.metadata!=='object'||Array.isArray(reused.metadata)||reused.metadata.quoteId!==quote.id)timeFail('This confirmation was already used.',409);return reused.id;}
   const calculation=quote.calculation&&typeof quote.calculation==='object'&&!Array.isArray(quote.calculation)?quote.calculation as Record<string,unknown>:{};
   if(quote.kind==='purchase'&&(typeof calculation.creationCostUs!=='string'||!quote.buyers||timePrice(calculation.creationCostUs,quote.buyers)!==quote.amountUs))timeFail('This price cannot be verified. Review it again.',409,'QUOTE_INVALID');
   let from=timeLedger.wallet(userId),to='treasury';
   if(quote.kind==='purchase'){
    await sql`select pg_advisory_xact_lock(hashtextextended(${`time-unlock:${userId}:${quote.productId}`},0))`.execute(tx);
    const owned=await timeLedger.purchases(tx,userId).where('e.productId','=',quote.productId!).executeTakeFirst();
    if(owned){await tx.updateTable('ionTimeQuotes').set({usedTransactionId:owned.transactionId}).where('id','=',quote.id).execute();return owned.transactionId;}
   }else{
    if(quote.kind==='payout'){if(!(await timeLedger.roles(userId,tx)).owner)timeFail('Only ION’s owner can make payouts.',403);from='treasury';}
    to=timeLedger.wallet(quote.recipientId!);await timeLedger.ensureWallet(tx,quote.recipientId!);
    const target=await tx.selectFrom('ionTimeAccounts').select('id').where('id','=',to).where(sql<boolean>`closed_at is null`).executeTakeFirst();if(!target)timeFail('This player cannot receive Time.',409);
   }
   await timeLedger.ensureWallet(tx,userId);
   const id=await timeLedger.post(tx,{id:randomUUID(),actor:userId,key,kind:quote.kind,from,to,amount:quote.amountUs,metadata:{quoteId:quote.id,...(quote.productId?{productId:quote.productId,buyers:quote.buyers,creationCostUs:calculation.creationCostUs,directUs:calculation.directUs,freeUs:calculation.freeUs,costVersion:calculation.costVersion}:{}),...(quote.recipientId?{recipientId:quote.recipientId}:{})}});
   if(quote.kind==='purchase')await tx.insertInto('ionTimeEntitlements').values({userId,productId:quote.productId!,transactionId:id}).onConflict(c=>c.columns(['userId','productId']).doUpdateSet({transactionId:id})).execute();
   await tx.updateTable('ionTimeQuotes').set({usedTransactionId:id}).where('id','=',quote.id).execute();return id;
  });return{receipt:await timeLedger.receipt(db,transactionId,userId),snapshot:await timeLedger.snapshot(userId)};
 }
 return{};
}
