import { db } from './db';
import { publish } from '@floot/realtime';
import { drainCloudRefresh } from './drainCloudRefresh';
describe('Administrative workspace invalidation',()=>{
 let deleted:boolean;
 beforeEach(()=>{deleted=false;const q={select:()=>q,where:()=>q,executeTakeFirst:async()=>({version:8}),execute:async()=>{deleted=true;}};spyOn(db,'selectFrom').and.returnValue(q as never);spyOn(db,'deleteFrom').and.returnValue(q as never);});
 it('publishes the canonical private channel and removes the delivered version',async()=>{(publish as jasmine.Spy).and.resolveTo(undefined);await drainCloudRefresh('workspace',8,'accounts',7);expect(publish).toHaveBeenCalledWith('cloud-accounts:7',{version:8,workspaceId:'workspace'});expect(deleted).toBeTrue();});
 it('retains the refresh when delivery fails without failing the read',async()=>{(publish as jasmine.Spy).and.rejectWith(new Error('Fixture outage'));await expectAsync(drainCloudRefresh('workspace',8,'home',0)).toBeResolved();expect(deleted).toBeFalse();});
});
