import { realtimeLease } from './realtimeLease';
import { RealtimeClient } from './RealtimeClient';
describe('Shared realtime connection leases',()=>{
  it('connects once and keeps another feature connected after one releases',async()=>{
    const connect=spyOn(RealtimeClient.prototype,'connect').and.resolveTo(),close=spyOn(RealtimeClient.prototype,'close').and.stub();
    const a=realtimeLease(69001),b=realtimeLease(69001);await Promise.all([a.connect(),b.connect()]);expect(connect.calls.count()).toBe(1);a.close();a.close();expect(close).not.toHaveBeenCalled();b.close();
    await new Promise(resolve=>setTimeout(resolve,1));expect(close.calls.count()).toBe(1);
  });
  it('retires old account grants immediately and ignores late release from the old account',async()=>{
    spyOn(RealtimeClient.prototype,'connect').and.resolveTo();const close=spyOn(RealtimeClient.prototype,'close').and.stub();
    const old=realtimeLease(69002);await old.connect();const next=realtimeLease(69003);expect(close.calls.count()).toBe(1);await next.connect();old.close();await new Promise(resolve=>setTimeout(resolve,1));expect(close.calls.count()).toBe(2);next.close();
    await new Promise(resolve=>setTimeout(resolve,1));expect(close.calls.count()).toBe(3);
  });
});
