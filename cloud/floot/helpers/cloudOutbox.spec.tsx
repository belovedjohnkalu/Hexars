import {waitFor} from '@testing-library/react';
import {cloudOutbox} from './cloudOutbox';
import {deviceData} from './deviceData';
describe('Durable cloud publishing queue',()=>{
 const uid=9008,first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
 beforeEach(()=>deviceData.setIdentity(uid));afterEach(async()=>{await cloudOutbox.drain(uid,'home');await deviceData.clear(String(uid));deviceData.setIdentity(null);});
 it('accepts the next cloud while the first publishes, binds the account and retries a failed cloud without duplication',async()=>{let release:(r:Response)=>void=()=>{},started=false,fail=true;const created:string[]=[];
 spyOn(globalThis,'fetch').and.callFake(async(_u,init)=>{const body=JSON.parse(String(init?.body));expect(body.expectedUserId).toBe(uid);if(body.action==='add'){if(body.id===first&&!started){started=true;return new Promise<Response>(r=>{release=r;});}if(body.id===second&&fail)return new Response(JSON.stringify({error:'Try again'}),{status:503});created.push(body.id);}return new Response(JSON.stringify({scope:'home',userId:uid,workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',version:created.length,nodes:[]}));});
 await cloudOutbox.enqueue(uid,'home',{id:first,name:'One',parentId:'ion'});await waitFor(()=>{if(!started)throw Error('Not started');});await cloudOutbox.enqueue(uid,'home',{id:second,name:'Two',parentId:'ion'});expect((await cloudOutbox.jobs(uid,'home')).length).toBe(2);release(new Response(JSON.stringify({scope:'home',userId:uid,version:1,nodes:[]})));await cloudOutbox.drain(uid,'home');expect((await cloudOutbox.jobs(uid,'home'))[0]?.status).toBe('failed');fail=false;await cloudOutbox.retry(uid,'home',second);await cloudOutbox.drain(uid,'home');expect(await cloudOutbox.jobs(uid,'home')).toEqual([]);expect(created).toEqual([second]);});
});
