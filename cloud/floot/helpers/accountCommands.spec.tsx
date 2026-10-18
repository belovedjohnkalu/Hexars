import { postAccounts } from '../endpoints/auth/accounts_POST.schema';
describe('Account command response recovery',()=>{
 it('turns an upstream non-JSON failure into an actionable account message',async()=>{spyOn(globalThis,'fetch').and.resolveTo(new Response('upstream connection unavailable',{status:502}));await expectAsync(postAccounts({action:'list'})).toBeRejectedWithError('Couldn’t update this account. Check your connection and try again.');});
 it('preserves an authorization explanation from the server',async()=>{spyOn(globalThis,'fetch').and.resolveTo(new Response(JSON.stringify({error:'Sign in to that account again.'}),{status:401}));await expectAsync(postAccounts({action:'switch',userId:42})).toBeRejectedWithError('Sign in to that account again.');});
 it('accepts an empty remembered-account list',async()=>{spyOn(globalThis,'fetch').and.resolveTo(new Response(JSON.stringify({accounts:[]})));expect((await postAccounts({action:'list'})).accounts).toEqual([]);});
});
