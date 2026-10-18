import { allocateIdentifiers,identifierSegment,rootIdentifiers,identifierFootprint,transferNodeIds,type IdentifierRecord } from './cloudIdentifiers';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Permanent owner cloud identifiers',()=>{
 const roots:IdentifierRecord[]=Object.entries(rootIdentifiers).map(([nodeId,label],i)=>({nodeId,parentId:null,label,arrivalOrdinal:String(i)}));
 it('omits placeholder zeros and counts each sibling arrival from zero',()=>{
  const nodes:CloudNode[]=[{id:'b',parentId:'public',name:'B'},{id:'c',parentId:'b',name:'C'},{id:'d',parentId:'c',name:'D'}];const result=allocateIdentifiers(nodes,roots,new Map());
  expect(result.records.get('public')?.label).toBe('IL1');expect(result.records.get('b')?.label).toBe('IL10');expect(result.records.get('c')?.label).toBe('IL100');expect(result.records.get('d')?.label).toBe('IL1000');
 });
 it('matches the requested alphabetic overflow and has room for at least 1024 arrivals',()=>{expect(identifierSegment(0)).toBe('0');expect(identifierSegment(9)).toBe('9');expect(identifierSegment(10)).toBe('A0');expect(identifierSegment(19)).toBe('A9');expect(identifierSegment(20)).toBe('B0');expect(identifierSegment(21)).toBe('B1');expect(identifierSegment(269)).toBe('Z9');expect(identifierSegment(270)).toBe('AA0');expect(identifierSegment(280)).toBe('AB0');expect(identifierSegment(7029)).toBe('ZZ9');expect(identifierSegment(7030)).toBe('AAA0');expect(identifierSegment(182789)).toBe('ZZZ9');expect(identifierSegment(182790)).toBe('AAAA0');expect(new Set(Array.from({length:1024},(_,i)=>identifierSegment(i))).size).toBe(1024);});
 it('never renumbers survivors, reuses a deleted number, or changes a label after a move',()=>{
  const a:CloudNode={id:'a',parentId:'public',name:'A'},b:CloudNode={id:'b',parentId:'public',name:'B'},first=allocateIdentifiers([a,b],roots,new Map());
  const records=[...first.records.values()],c:CloudNode={id:'c',parentId:'public',name:'C'},next=allocateIdentifiers([b,c],records,new Map(first.counters));
  expect(next.records.get('b')?.label).toBe('IL11');expect(next.records.get('c')?.label).toBe('IL12');expect(next.records.get('a')?.label).toBe('IL10');
  const moved=allocateIdentifiers([{...b,parentId:'private'}],[...next.records.values()],new Map(next.counters));expect(moved.records.get('b')?.label).toBe('IL11');expect(moved.added.length).toBe(0);
 });
 it('retains restoration labels and assigns new identities to copies, even after reload',()=>{
  const nodes:CloudNode[]=[{id:'gone',parentId:'private',name:'Deleted',removedBy:'op'},{id:'live',parentId:'private',name:'Live'}],first=allocateIdentifiers(nodes,roots,new Map()),reloaded=allocateIdentifiers([...nodes,{id:'copy',parentId:'private',name:'Copy'}],[...first.records.values()],new Map(first.counters));expect(reloaded.records.get('gone')?.label).toBe('IL20');expect(reloaded.records.get('live')?.label).toBe('IL21');expect(reloaded.records.get('copy')?.label).toBe('IL22');
 });
 it('assigns ancestors before descendants and preserves independent branch numbering',()=>{
  const nodes=[{id:'deep',parentId:'parent'},{id:'parent',parentId:'public'},{id:'other',parentId:'public'},{id:'other-child',parentId:'other'}];const result=allocateIdentifiers(nodes,roots,new Map());expect(result.records.get('deep')?.label).toBe('IL100');expect(result.records.get('other')?.label).toBe('IL11');expect(result.records.get('other-child')?.label).toBe('IL110');expect(new Set([...result.records.values()].map(n=>n.label)).size).toBe(result.records.size);
 });
 it('preserves every node identity on a cross-space move and creates new identities only for copies',()=>{const nodes=[{id:'parent'},{id:'child'}];const moved=transferNodeIds(nodes,'parent','operation',false,()=> 'new-child'),copied=transferNodeIds(nodes,'parent','operation',true,()=> 'new-child');expect([...moved.values()]).toEqual(['parent','child']);expect([...copied.values()]).toEqual(['operation','new-child']);});
 it('reserves readable label geometry and rejects cycles',()=>{expect(identifierFootprint('IL10').width).toBeGreaterThan(20);expect(identifierFootprint('IL'+'A'.repeat(102)+'4').height).toBeGreaterThan(12);expect(()=>allocateIdentifiers([{id:'a',parentId:'b'},{id:'b',parentId:'a'}],roots,new Map())).toThrowError(/cycle/);});
});
