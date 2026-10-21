import {cloudTree} from './cloudTree';
import {chessVariants} from './chessVariants';
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


describe('Variant discovery across canonical navigation',()=>{
 const paid=chessVariants.all.filter(v=>v.id!=='glinski');
 it('hides every unaffordable Board and Rules root, including roots without variant metadata',()=>{
  const visible=featureClouds(cloudTree.seed,paid.map(v=>product('variant:'+v.id,false))),ids=new Set(visible.map(n=>n.id));
  for(const v of paid){expect(ids.has(v.id+'-board')).toBeFalse();expect(ids.has(v.id+'-rules')).toBeFalse();expect(visible.some(n=>n.variant===v.id)).toBeFalse();}
  expect(ids.has('glinski-board')).toBeTrue();expect(ids.has('glinski-rules')).toBeTrue();
 });
 it('gates affordable destinations and permanent rule IDs, preserving renamed/stored roots and inherited children',()=>{
  const roots:CloudNode[]=[{id:'custom-board',parentId:null,name:'Renamed',destination:'mccooey'},{id:'mccooey-rules',parentId:null,name:'Renamed rules'},{id:'custom-paragraph',parentId:'mccooey-rules',name:'Text',note:'Private paid rule'}];
  expect(featureClouds(roots,[])).toEqual([]);
  const shown=featureClouds(roots,[product('variant:mccooey',true)]);expect(shown.length).toBe(3);expect(shown.every(n=>n.lockedItem==='variant:mccooey')).toBeTrue();expect(shown[2].note).toBeUndefined();
  const owned=featureClouds(roots,[product('variant:mccooey',false,true)]);expect(owned.length).toBe(3);expect(owned.every(n=>!n.lockedItem)).toBeTrue();expect(owned[2].note).toBe('Private paid rule');expect(featureClouds(roots,[],true).length).toBe(3);
 });
});
