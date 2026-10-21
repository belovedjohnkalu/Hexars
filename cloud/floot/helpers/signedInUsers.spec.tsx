import { publish } from '@floot/realtime';
import { signedInUsersChanged } from './signedInUsers';
import { channels } from './realtimeChannels';
describe('Signed-in population invalidation',()=>{
 it('uses the shared catalog channel without leaking accounts or session identifiers',async()=>{
  (publish as jasmine.Spy).and.resolveTo({ok:true});await signedInUsersChanged();expect(publish).toHaveBeenCalledWith(channels.timeCatalog,{changed:true});
 });
 it('does not turn a realtime outage into a failed sign-in or sign-out',async()=>{
  spyOn(console,'error');(publish as jasmine.Spy).and.rejectWith(new Error('Offline'));await expectAsync(signedInUsersChanged()).toBeResolved();
 });
});
