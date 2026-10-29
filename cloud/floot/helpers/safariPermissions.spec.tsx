import { cloudPolicy } from './cloudPolicy';
import { db } from './db';
const credentials={scope:'public' as const,workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'0'.repeat(64)};
describe('Safari mutation authority',()=>{
 const word={id:'foreign',parentId:'public',name:'Author word',createdBy:7};
 it('reserves edit, redirect, move and deletion for its author or registered devs',()=>{for(const whole of [false,true]){expect(()=>cloudPolicy.assert('public',[word],'foreign',7,false,whole)).not.toThrow();expect(()=>cloudPolicy.assert('public',[word],'foreign',8,true,whole)).not.toThrow();expect(()=>cloudPolicy.assert('public',[word],'foreign',9,false,whole)).toThrow();expect(()=>cloudPolicy.assert('public',[word],'foreign',null,false,whole)).toThrow();}});
 it('keeps mixed-author branches protected from an ordinary author',()=>{const child={id:'child',parentId:'foreign',name:'Another author',createdBy:9};expect(()=>cloudPolicy.assert('public',[word,child],'foreign',7,false,true)).toThrow();expect(()=>cloudPolicy.assert('public',[word,child],'foreign',8,true,true)).not.toThrow();});
});
describe('Authenticated Safari API protection',()=>{
 let member=false;const writes:string[]=[];
 beforeEach(()=>{
  process.env.JWT_SECRET='safari-test-only-not-a-production-key';writes.length=0;member=false;
  const query=(table:string)=>{const q={select:()=>q,selectAll:()=>q,innerJoin:()=>q,where:()=>q,limit:()=>q,set:()=>q,
   execute:async()=>table==='sessions'?[{id:8,email:'fixture@example.invalid',displayName:'Fixture',role:'admin',avatarUrl:null}]:table==='ionSharedSpaces'?[{kind:'public',workspaceId:'safari',ownerUserId:1},{kind:'home',workspaceId:'home',ownerUserId:1}]:[],
   executeTakeFirst:async()=>table==='ionDevAccounts'&&member?{userId:8,devNumber:'1'}:undefined,
   executeTakeFirstOrThrow:async()=>({id:table==='ionWorkspaces'?'safari':'row',ownerId:1,version:0,nodes:[{id:'foreign',parentId:'public',name:'Author word',createdBy:7}]})};return q;};
  spyOn(Math,'random').and.returnValue(1);spyOn(db,'selectFrom').and.callFake(table=>query(String(table)) as never);spyOn(db,'updateTable').and.callFake(table=>{writes.push(String(table));return query(String(table)) as never;});
 });
 async function request(body:unknown){const {SignJWT}=await import('jose');const token=await new SignJWT({id:'test-session',createdAt:Date.now(),lastAccessed:Date.now()}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(new TextEncoder().encode(process.env.JWT_SECRET));return new Request('https://example.invalid/_api/cloud',{method:'POST',headers:{cookie:'floot_built_app_session='+token,'Content-Type':'application/json'},body:JSON.stringify(body)});}
 it('recognizes any registered dev for Safari, allowing shared Home content editing',async()=>{const {cloudContext}=await import('./cloudContext');member=true;expect((await cloudContext(await request({}),{...credentials,action:'load'})).owner).toBeTrue();expect((await cloudContext(await request({}),{...credentials,scope:'home',action:'load'})).owner).toBeTrue();member=false;expect((await cloudContext(await request({}),{...credentials,action:'load'})).owner).toBeFalse();});
 it('does not let caller-supplied dev flags bypass word or duplicate-name limits',async()=>{
  const {handle}=await import('../endpoints/cloud_POST');
  for(const name of ['Three separate words','Author word']){
   const response=await handle(await request({...credentials,action:'add',id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',parentId:'public',name,version:0,dev:true,owner:true}));
   expect(response.status).toBe(422);
  }
  expect(writes).not.toContain('ionWorkspaces');
 });
 it('rejects forged permissions before writing words for all four protected actions',async()=>{const {handle}=await import('../endpoints/cloud_POST');for(const input of [{action:'update',name:'Forged',note:'Forged',photoMode:'keep'},{action:'rename',name:'Forged'},{action:'link',target:{kind:'url',url:'https://example.invalid'}},{action:'move',parentId:'public'},{action:'remove',operationId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',expectedCount:0}]){const response=await handle(await request({...credentials,...input,id:'foreign',version:0,owner:true,dev:true,canEdit:true,createdBy:8}));expect(response.status).withContext(input.action).toBe(403);}expect(writes).not.toContain('ionWorkspaces');});
});
