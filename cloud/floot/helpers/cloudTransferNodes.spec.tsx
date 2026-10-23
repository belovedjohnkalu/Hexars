import { cloudTransferNodes } from './cloudTransferNodes';
describe('Safari transfer authorship',()=>{
 const group=[{id:'a',parentId:'public',name:'One',createdBy:7},{id:'b',parentId:'a',name:'Two',createdBy:8}],ids=new Map([['a','new-a'],['b','new-b']]);
 it('preserves each original author and hierarchy when moved by a dev',()=>{const next=cloudTransferNodes(group,ids,'a','destination','op',1,false);expect(next.map(n=>n.createdBy)).toEqual([7,8]);expect(next.map(n=>n.parentId)).toEqual(['destination','new-a']);expect(group[0].parentId).toBe('public');});
 it('assigns newly duplicated words to the person adding the copy',()=>{expect(cloudTransferNodes(group,ids,'a','destination','op',9,true).map(n=>n.createdBy)).toEqual([9,9]);});
});
