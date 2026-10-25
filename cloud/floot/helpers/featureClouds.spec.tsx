import {cloudTree} from './cloudTree';
import {chessVariants} from './chessVariants';
import {isFreeVariant} from './computerPolicy';
import { featureClouds } from './featureClouds';
import type { TimeProduct } from '../endpoints/time_POST.schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
const nodes:CloudNode[]=[{id:'variants',parentId:null,name:'Variants'},{id:'kruzno',parentId:'variants',name:'Kruzno',variant:'kruzno'},{id:'kruzno-rule',parentId:'kruzno',name:'Rules'},{id:'hexdame',parentId:'variants',name:'HexDame',variant:'hexdame'},{id:'board',parentId:null,name:'Variant',variant:'mccooey'}];
const product=(id:string,affordable:boolean,owned=false)=>({id,affordable,owned} as TimeProduct);
describe('Affordable feature discovery',()=>{
 it('hides unaffordable products and their descendants but preserves free entries',()=>{expect(featureClouds(nodes,[product('variant:kruzno',false),product('variant:mccooey',false)]).map(n=>n.id)).toEqual(['variants','hexdame']);});
 it('shows affordable entries with a purchase gate, removes the gate after buying, and exempts devs',()=>{const shown=featureClouds(nodes,[product('variant:kruzno',true),product('variant:mccooey',true,true)]);expect(shown.find(n=>n.id==='kruzno')?.lockedItem).toBe('variant:kruzno');expect(shown.find(n=>n.id==='kruzno-rule')?.lockedItem).toBe('variant:kruzno');expect(shown.find(n=>n.id==='board')?.lockedItem).toBeUndefined();expect(featureClouds(nodes,[],true).length).toBe(nodes.length);});
 it('fails closed for missing products and cyclic paths',()=>{expect(featureClouds(nodes,[]).some(n=>n.id==='kruzno')).toBeFalse();expect(featureClouds([{id:'a',parentId:'a',name:'A'}],[])).toEqual([]);});
});


describe('Variant discovery across canonical navigation',()=>{
 const paid=chessVariants.all.filter(v=>!isFreeVariant(v.id));
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

import { scheduleCalendar } from './scheduleCalendar';
describe('Schedule purchase discovery',()=>{const nodes=[{id:'ion',parentId:null,name:'ION'},{id:scheduleCalendar.root,parentId:'ion',name:'Schedule'},{id:'year',parentId:scheduleCalendar.root,name:'2027',calendarDate:{year:2027}}];it('hides an unpriced or unaffordable Schedule and its dates',()=>{expect(featureClouds(nodes,[]).map(n=>n.id)).toEqual(['ion']);});it('shows an affordable Schedule with the same purchase gate as other features',()=>{const product={id:'feature:schedule',owned:false,affordable:true} as TimeProduct;const visible=featureClouds(nodes,[product]);expect(visible.find(n=>n.id===scheduleCalendar.root)?.lockedItem).toBe('feature:schedule');product.owned=true;expect(featureClouds(nodes,[product]).every(n=>!n.lockedItem)).toBeTrue();expect(featureClouds(nodes,[],true).length).toBe(nodes.length);});});

describe('Retired pricing overrides',()=>{it('hides stored old price branches for dev and ordinary accounts while keeping purchase history separate',()=>{const nodes:CloudNode[]=[{id:'time-price-engine:tactical',parentId:'time-prices',name:'Renamed old price'},{id:'custom-child',parentId:'time-price-engine:tactical',name:'Details'},{id:'receipt',parentId:'time-added',name:'Historical purchase'}];for(const dev of [false,true])expect(featureClouds(nodes,[],dev).map(n=>n.id)).toEqual(['receipt']);});});
