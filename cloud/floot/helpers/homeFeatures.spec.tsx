import { homeFeatures,hiddenFeaturesId } from './homeFeatures';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Personal Home features',()=>{
 const source:CloudNode[]=[{id:'ion',parentId:null,name:'ION'},{id:'a',parentId:'ion',name:'Feature',identifier:'IL01'},{id:'b',parentId:'a',name:'Contents'},{id:hiddenFeaturesId,parentId:'ion',name:'Hidden'}];
 it('hides a root without losing its contents or permanent identity',()=>{const result=homeFeatures(source,['a'],true);expect(result[1]).toEqual(jasmine.objectContaining({id:'a',parentId:hiddenFeaturesId,identifier:'IL01',canHide:true,hiddenFeature:true}));expect(result[2]).toEqual(source[2]);expect(source[1].parentId).toBe('ion');expect(result[3].canHide).toBeUndefined();});
 it('restores Home and does not grant shared editing permission',()=>{const result=homeFeatures(source,[],true);expect(result[1].parentId).toBe('ion');expect(result[1].canEdit).toBeUndefined();expect(homeFeatures(source,[],false)[1].canHide).toBeFalse();});
 it('never recreates a feature removed by the entitlement/privacy filter',()=>{expect(homeFeatures(source.filter(n=>n.id!=='a'),['a','secret'],true).some(n=>n.id==='a'||n.id==='secret')).toBeFalse();});
 it('shows Hidden only for available hidden Home features, including after the last restore',()=>{
  for(const hidden of [[],['unknown'],['b'],[hiddenFeaturesId]])expect(homeFeatures(source,hidden,true).some(n=>n.id===hiddenFeaturesId)).toBeFalse();
  expect(homeFeatures(source,['a'],true).some(n=>n.id===hiddenFeaturesId)).toBeTrue();
  expect(homeFeatures(source,[],true).some(n=>n.id===hiddenFeaturesId)).toBeFalse();
  expect(homeFeatures(source.filter(n=>n.id!=='a'),['a'],true).some(n=>n.id===hiddenFeaturesId)).toBeFalse();
  expect(homeFeatures(source,[],false).some(n=>n.id===hiddenFeaturesId)).toBeFalse();
 });
});
