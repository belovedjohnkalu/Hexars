import { cloudTree } from './cloudTree';
import { cloudChanges } from './cloudChanges';
import { cloudPolicy } from './cloudPolicy';
describe('Editable Time hub',()=>{
 const seeds=cloudTree.forScope('home');
 it('contains Activity and removes the redundant Balance entry',()=>{const hub=seeds.filter(n=>n.parentId==='time');expect(hub.some(n=>n.id==='time-activity')).toBeTrue();expect(hub.some(n=>n.id==='time-balance')).toBeFalse();});
 it('uses the existing owner-only shared edit policy and persists seed overrides',()=>{const activity=seeds.find(n=>n.id==='time-activity')!;expect(cloudPolicy.edit('home',activity,1,true)).toBeTrue();expect(cloudPolicy.edit('home',activity,2,false)).toBeFalse();const next=cloudChanges.apply([],{action:'rename',scope:'home',workspaceId:'00000000-0000-4000-8000-000000000001',accessToken:'0'.repeat(64),id:activity.id,name:'My activity',version:0},0,seeds);expect(next.find(n=>n.id===activity.id)?.name).toBe('My activity');});
});
