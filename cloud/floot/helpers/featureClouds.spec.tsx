import { featureClouds } from './featureClouds';
import type { TimeProduct } from '../endpoints/time_POST.schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
const nodes:CloudNode[]=[{id:'engines',parentId:null,name:'Engines'},{id:'tactical',parentId:'engines',name:'Tactical'},{id:'tactical-level-0',parentId:'tactical',name:'Beginner',destination:'level'},{id:'universal',parentId:'engines',name:'Universal'},{id:'board',parentId:null,name:'Variant',variant:'mccooey'}];
const product=(id:string,affordable:boolean,owned=false)=>({id,affordable,owned} as TimeProduct);
describe('Affordable feature discovery',()=>{
 it('hides unaffordable products and their descendants but preserves free entries',()=>{expect(featureClouds(nodes,[product('engine:tactical',false),product('variant:mccooey',false)]).map(n=>n.id)).toEqual(['engines','universal']);});
 it('shows affordable entries with a purchase gate, removes the gate after buying, and exempts devs',()=>{const shown=featureClouds(nodes,[product('engine:tactical',true),product('variant:mccooey',true,true)]);expect(shown.find(n=>n.id==='tactical')?.lockedItem).toBe('engine:tactical');expect(shown.find(n=>n.id==='tactical-level-0')?.lockedItem).toBe('engine:tactical');expect(shown.find(n=>n.id==='board')?.lockedItem).toBeUndefined();expect(featureClouds(nodes,[],true).length).toBe(nodes.length);});
 it('fails closed for missing products and cyclic paths',()=>{expect(featureClouds(nodes,[]).some(n=>n.id==='tactical')).toBeFalse();expect(featureClouds([{id:'a',parentId:'a',name:'A'}],[])).toEqual([]);});
});
