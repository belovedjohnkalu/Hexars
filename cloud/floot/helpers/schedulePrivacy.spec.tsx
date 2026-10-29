import { cloudPolicy } from './cloudPolicy';
import { scheduleWorkspace } from './scheduleWorkspace';
import { scheduleCalendar } from './scheduleCalendar';
import { db } from './db';
import { timeLedger } from './timeLedger';
describe('Personal schedule privacy',()=>{
 it('allows dev edits within the resolved account workspace while keeping ordinary entries author-bound',()=>{
 const entry={id:'entry',parentId:'date',name:'Private',createdBy:7},date={id:'date',parentId:scheduleCalendar.root,name:'1',calendarDate:{year:2026,month:10,day:1}};
 expect(cloudPolicy.edit('schedule',entry,7,false)).toBeTrue();expect(cloudPolicy.edit('schedule',entry,8,true)).toBeTrue();expect(cloudPolicy.edit('schedule',entry,null,true)).toBeFalse();expect(cloudPolicy.edit('schedule',date,7,true)).toBeTrue();
 });
 it('selects a workspace by authenticated user ID, independent of dev flags or client credentials',async()=>{
 const conditions:unknown[][]=[],expected={id:'own-workspace',ownerId:7,nodes:[],version:0};
 const query={select:()=>query,selectAll:()=>query,innerJoin:()=>query,where:(...args:unknown[])=>{conditions.push(args);return query;},forUpdate:()=>query,executeTakeFirstOrThrow:async()=>({id:7}),executeTakeFirst:async()=>expected};
 const tx={selectFrom:()=>query};spyOn(db,'transaction').and.returnValue({execute:async(work:(value:unknown)=>Promise<unknown>)=>work(tx)} as never);
 expect(await scheduleWorkspace(7)).toBe(expected as never);expect(conditions).toContain(['userId','=',7]);expect(conditions).toContain(['id','=',7]);
 });
});

describe('Authenticated schedule context isolation',()=>{
 it('ignores a stolen workspace ID for both regular and dev accounts',async()=>{
  process.env.JWT_SECRET='schedule-test-only-not-a-production-key';
  spyOn(timeLedger,'catalog').and.resolveTo({dev:false,products:[{id:'feature:schedule',owned:true}]} as never);
  const {cloudContext}=await import('./cloudContext'),{SignJWT}=await import('jose');
  let uid=7;const conditions:Array<{table:string;args:unknown[]}>=[];
  const query=(table:string)=>{const q={select:()=>q,selectAll:()=>q,innerJoin:()=>q,forUpdate:()=>q,limit:()=>q,set:()=>q,where:(...args:unknown[])=>{conditions.push({table,args});return q;},
   execute:async()=>table==='sessions'?[{id:uid,email:'fixture@example.invalid',displayName:'Fixture',role:uid===8?'admin':'user',avatarUrl:null}]:table==='ionSharedSpaces'?[{kind:'home',workspaceId:'shared-home',ownerUserId:1}]:[],
   executeTakeFirst:async()=>table==='ionDevAccounts'?(uid===8?{userId:8,devNumber:'1'}:undefined):table==='ionScheduleAccounts'?{id:'private-'+uid,ownerId:uid,nodes:[{id:'note-'+uid,parentId:'date',name:'Only '+uid,createdBy:uid}],version:0}:undefined,
   executeTakeFirstOrThrow:async()=>table==='users'?{id:uid,timeZone:'UTC'}:{id:'shared-home',ownerId:1,nodes:[],version:0}};return q;};
  spyOn(Math,'random').and.returnValue(1);spyOn(db,'selectFrom').and.callFake(table=>query(String(table)) as never);spyOn(db,'updateTable').and.callFake(table=>query(String(table)) as never);
  spyOn(db,'transaction').and.returnValue({execute:async(work:(value:unknown)=>Promise<unknown>)=>work({selectFrom:query})} as never);
  for(const id of [7,8]){uid=id;const token=await new SignJWT({id:'test-session',createdAt:Date.now(),lastAccessed:Date.now()}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(new TextEncoder().encode(process.env.JWT_SECRET));
   const request=new Request('https://example.invalid/_api/cloud',{headers:{cookie:'floot_built_app_session='+token}});
   const result=await cloudContext(request,{action:'load',scope:'schedule',workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'0'.repeat(64)});
   expect(result.row!.id).toBe('private-'+id);expect(result.owner).toBe(id===8);expect(result.isDev).toBe(id===8);expect(JSON.stringify(result.row!.nodes)).not.toContain('note-'+(id===7?8:7));
  }
  expect(conditions.filter(n=>n.table==='ionScheduleAccounts').map(n=>n.args)).toEqual([['userId','=',7],['userId','=',8]]);
 });
});
