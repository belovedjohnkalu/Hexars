import { publicBootstrap } from './publicBootstrap';
describe('Anonymous bootstrap boundary',()=>{
  it('coalesces independent public consumers and never forwards a session',async()=>{
    publicBootstrap.changed(69001);const fetch=spyOn(globalThis,'fetch').and.resolveTo(new Response(JSON.stringify({time:{userId:null},home:{scope:'home'},chess:{scope:'chess'}})));
    const [a,b]=await Promise.all([publicBootstrap.read(),publicBootstrap.read()]);expect(a).toBe(b);expect(fetch.calls.count()).toBe(1);expect(fetch.calls.first().args[1]?.credentials).toBe('omit');expect(await publicBootstrap.read()).toBe(a);expect(fetch.calls.count()).toBe(1);
  });
  it('rejects personalized data and lets a failed read be retried',async()=>{
    publicBootstrap.changed(69002);const fetch=spyOn(globalThis,'fetch').and.resolveTo(new Response(JSON.stringify({time:{userId:1},home:{},chess:{}})));
    await expectAsync(publicBootstrap.read()).toBeRejected();fetch.and.callFake(async()=>new Response(JSON.stringify({time:{userId:null},home:{},chess:{}})));await expectAsync(publicBootstrap.read()).toBeResolved();expect(fetch.calls.count()).toBe(2);
  });
});
