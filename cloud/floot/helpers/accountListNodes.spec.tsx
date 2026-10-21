import { accountListNodes } from './accountListNodes';
import { accountDeviceNodes } from './accountDeviceNodes';
describe('Other Accounts navigation',()=>{
 it('keeps the current account at root and groups other local accounts',()=>{const nodes=accountListNodes([{id:1,displayName:'Current'},{id:2,displayName:'Other'}],1);expect(nodes.find(n=>n.id==='remembered-1')?.parentId).toBe('accounts');expect(nodes.find(n=>n.id==='remembered-2')?.parentId).toBe('account-others');expect(nodes.find(n=>n.id==='remembered-2-open')?.accountAction).toBe('switch:2');expect(nodes.find(n=>n.id==='account-others')?.name).toBe('Other Accounts');});
 it('migrates stored root placements without changing existing node identities',()=>{const seed=accountListNodes([{id:2,displayName:'Other'}],1),nodes=accountDeviceNodes(seed,[{id:'remembered-2',parentId:'accounts',name:'Saved name',identifier:'IL050'}]);expect(nodes.find(n=>n.id==='remembered-2')?.parentId).toBe('account-others');expect(nodes.find(n=>n.id==='remembered-2')?.identifier).toBe('IL050');});
});
