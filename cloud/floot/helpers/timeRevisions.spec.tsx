import { timeOperations } from './timeOperations';
import { timeLedger } from './timeLedger';
import { db } from './db';
describe('Published estimate revisions',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 let proposal:any,products:any[],updates:Array<{table:string;value:any}>,audits:any[];
 beforeEach(()=>{
  proposal={id,productId:'engine:tactical',durationUs:'200',basis:'Corrected total'};
  products=[{id:'engine:tactical',proposalId:'old',publishedAt:new Date(0),directUs:'100',freeUs:'5'},{id:'engine:positional',proposalId:'other',publishedAt:new Date(0),directUs:'90',freeUs:'5'}];updates=[];audits=[];
  spyOn(timeLedger,'roles').and.resolveTo({dev:true,owner:true});
  const executor=db.getExecutor();spyOn(executor,'executeQuery').and.callFake(async(query:any)=>{audits.push(query);return{rows:[]} as any;});
  const tx:any={getExecutor:()=>executor,selectFrom:(table:string)=>{const chain:any={selectAll:()=>chain,select:()=>chain,where:()=>chain,forUpdate:()=>chain,orderBy:()=>chain,execute:async()=>products,executeTakeFirstOrThrow:async()=>table==='ionTimeConfig'?{freeProposalId:'free'}:table==='ionTimeCostProposals'?proposal:products[0]};return chain;},updateTable:(table:string)=>{const chain:any={set:(value:any)=>{updates.push({table,value});return chain;},where:()=>chain,execute:async()=>[]};return chain;}};
  spyOn(db,'transaction').and.returnValue({execute:async(fn:any)=>fn(tx)} as any);
 });
 it('retains historical estimates but rejects obsolete per-product publication commands',async()=>{
  await expectAsync(timeOperations({action:'approve',proposalId:id},1,'session')).toBeRejected();
  await expectAsync(timeOperations({action:'propose',productId:'engine:tactical',durationUs:'200',basis:'Old model',requestId:id},1,'session')).toBeRejected();
  expect(updates.length).toBe(0);expect(audits.length).toBe(0);
 });
 it('freezes each new quote from one catalog snapshot without re-reading changed costs',async()=>{
  spyOn(timeLedger,'catalog').and.resolveTo({buyers:10,pricingReady:true,products:[{id:'engine:tactical',name:'Tactical',published:true,owned:false,priceUs:'12',directUs:'100',freeUs:'15',proposalId:'old'}]} as any);
  const values:any[]=[];spyOn(db,'insertInto').and.returnValue({values:(value:any)=>{values.push(value);return{execute:async()=>[]};}} as any);
  spyOn(db,'selectFrom').and.throwError('Do not read a second cost version');
  const result=await timeOperations({action:'quote',kind:'purchase',productId:'engine:tactical'},1,'session');
  expect(result.quote?.amountUs).toBe('12');expect(values[0].calculation.creationCostUs).toBe('115');expect(values[0].calculation.costVersion).toBe('old');expect(db.selectFrom).not.toHaveBeenCalled();
 });
 it('does not publish on behalf of an ordinary dev',async()=>{
  (timeLedger.roles as jasmine.Spy).and.resolveTo({dev:true,owner:false});
  await expectAsync(timeOperations({action:'approve',proposalId:id},2,'session')).toBeRejected();expect(updates.length).toBe(0);
 });
});
