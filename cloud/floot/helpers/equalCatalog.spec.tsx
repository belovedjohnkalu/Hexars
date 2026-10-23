import { db } from './db';
import { timeLedger } from './timeLedger';
describe('The real catalog uses one shared work total',()=>{
 it('gives every published paid feature the same price despite different legacy estimates',async()=>{
  const executor=db.getExecutor();spyOn(executor,'executeQuery').and.callFake(async q=>({rows:String(q.sql).includes('ion_work_config')?[{baselineUs:'125',recordedUs:'75',basis:'Earlier',updatedAt:new Date()}]:[]}) as never);
  const products=[{id:'engine:positional',kind:'engine',reference:'positional',name:'Positional',directUs:'9999',freeUs:'999',publishedAt:new Date(0)},{id:'variant:wellisch',kind:'variant',reference:'wellisch',name:'Wellisch',directUs:'1',freeUs:'0',publishedAt:new Date(0)}];
  const build=(t:string)=>{const q={select:()=>q,selectAll:()=>q,innerJoin:()=>q,where:()=>q,whereRef:()=>q,orderBy:()=>q,execute:async()=>t==='ionTimeProducts'?products:[],executeTakeFirst:async()=>t==='ionTimeAccounts'?{balanceUs:'10000'}:undefined,executeTakeFirstOrThrow:async()=>t==='sessions'?{buyers:5}:{productionStartedAt:new Date(0)}};return q;};spyOn(db,'selectFrom').and.callFake(t=>build(String(t)) as never);const mutate=spyOn(db,'updateTable');
  const result=await timeLedger.catalog(7);expect(result.totalWorkUs).toBe('200');expect(result.buyers).toBe(5);expect(result.paidFeatures).toBe(2);expect(result.products.map(p=>p.costUs)).toEqual(['100','100']);expect(result.products.map(p=>p.priceUs)).toEqual(['20','20']);expect(result.products.every(p=>p.affordable)).toBeTrue();expect(mutate).not.toHaveBeenCalled();
 });
});
