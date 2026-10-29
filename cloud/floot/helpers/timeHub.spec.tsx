import {timeHubNodes} from './timePresentation';
import { cloudTree } from './cloudTree';
import { cloudChanges } from './cloudChanges';
import { cloudPolicy } from './cloudPolicy';
describe('Editable Time hub',()=>{
 const seeds=cloudTree.forScope('home');
 it('restores Activity around the three totals without the old Balance wrapper',()=>{const hub=seeds.filter(n=>n.parentId==='time');expect(hub.some(n=>n.id==='time-activity')).toBeTrue();for(const id of ['time-added','time-spent','time-remaining'])expect(seeds.some(n=>n.parentId==='time-activity'&&n.id===id)).toBeTrue();expect(hub.some(n=>n.id==='time-balance')).toBeFalse();});
 it('uses the existing owner-only shared edit policy and persists seed overrides',()=>{const activity=seeds.find(n=>n.id==='time-added')!;expect(cloudPolicy.edit('home',activity,1,true)).toBeTrue();expect(cloudPolicy.edit('home',activity,2,false)).toBeFalse();const next=cloudChanges.apply([],{action:'rename',scope:'home',workspaceId:'00000000-0000-4000-8000-000000000001',accessToken:'0'.repeat(64),id:activity.id,name:'My activity',version:0},0,seeds);expect(next.find(n=>n.id===activity.id)?.name).toBe('My activity');});
});


describe('Activity deletion with retained droplets',()=>{
 it('preserves totals and custom droplets in Reserve after deleting only Activity',()=>{
  const seeds=cloudTree.forScope('home'),extra={id:'custom-activity',parentId:'time-activity',name:'My records'},all=[...seeds,extra];
  const overrides=cloudChanges.apply([extra],{action:'remove',scope:'home',workspaceId:'00000000-0000-4000-8000-000000000001',accessToken:'0'.repeat(64),id:'time-activity',operationId:'00000000-0000-4000-8000-000000000002',version:0,expectedCount:4,keepChildren:true},0,seeds);
  const merged=[...new Map([...all,...overrides].map(n=>[n.id,n])).values()].filter(n=>!n.removedBy);
  const presented=timeHubNodes(merged,null,{addedUs:'0',spentUs:'0',balanceUs:'0'});
  expect(presented.some(n=>n.id==='time-activity')).toBeFalse();
  for(const id of ['time-added','time-spent','time-remaining','custom-activity'])expect(presented.find(n=>n.id===id)?.parentId).withContext(id).toBe('time');
 });
});
