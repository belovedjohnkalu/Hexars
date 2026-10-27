import { publish } from '@floot/realtime';
import { queueTask } from '@floot/queueTask';
import { db } from './db';
import { signedInUsersChanged } from './signedInUsers';
import { announceSignedInUsers } from './announceSignedInUsers';
import { channels } from './realtimeChannels';
describe('Batched signed-in population announcements',()=>{
 let held:boolean;
 beforeEach(()=>{held=false;const update=()=>{const q={set:()=>q,where:()=>q,returning:()=>q,execute:async()=>[],executeTakeFirst:async()=>{if(held)return;held=true;return{id:true};}};return q;};spyOn(db,'updateTable').and.callFake(()=>update() as never);(queueTask as jasmine.Spy).and.resolveTo({});(publish as jasmine.Spy).and.resolveTo({ok:true});});
 it('queues one account-free observation for a concurrent sign-in burst',async()=>{await Promise.all([signedInUsersChanged(),signedInUsersChanged(),signedInUsersChanged()]);expect(queueTask).toHaveBeenCalledTimes(1);expect((queueTask as jasmine.Spy).calls.first().args[0]).toBe('announceSignedInUsers');expect(Object.keys((queueTask as jasmine.Spy).calls.first().args[1])).toEqual(['leaseId']);expect(publish).not.toHaveBeenCalled();});
 it('does not turn a queue outage into a failed sign-in or sign-out',async()=>{spyOn(console,'error');(queueTask as jasmine.Spy).and.rejectWith(new Error('Offline'));await expectAsync(signedInUsersChanged()).toBeResolved();});
 it('publishes only an aggregate observation, never account or session identifiers',async()=>{const select=()=>{const q={innerJoin:()=>q,select:()=>q,where:()=>q,executeTakeFirstOrThrow:async()=>({buyers:5})};return q;};spyOn(db,'selectFrom').and.callFake(()=>select() as never);jasmine.clock().install();try{const pending=announceSignedInUsers({leaseId:'fixture'});jasmine.clock().tick(2000);await pending;expect(publish).toHaveBeenCalled();const [channel,event]=(publish as jasmine.Spy).calls.mostRecent().args;expect(channel).toBe(channels.timeCatalog);expect(event.buyers).toBe(5);expect(Object.keys(event).sort()).toEqual(['buyers','buyersObservedAt']);}finally{jasmine.clock().uninstall();}});
});
