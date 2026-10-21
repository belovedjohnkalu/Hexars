import { functionClouds,receiptClouds,savedFunctionClouds } from './functionClouds';
import { cloudTree } from './cloudTree';
import { allocateIdentifiers,rootIdentifiers,type IdentifierRecord } from './cloudIdentifiers';
describe('Permanent functional cloud identities',()=>{
 it('gives every Time word and every variant action a permanent, distinct birth label',()=>{
  const existing:IdentifierRecord[]=[{nodeId:'ion',parentId:null,label:'IL',arrivalOrdinal:'0'},...Object.entries(rootIdentifiers).map(([nodeId,label])=>({nodeId,parentId:'ion',label,arrivalOrdinal:'0'}))];
  const nodes=[...cloudTree.forScope('home'),...cloudTree.forScope('chess'),...functionClouds,...receiptClouds({id:'receipt',direction:'in'}),...savedFunctionClouds('saved',[{ply:1},{ply:2}],[0,1,2])],first=allocateIdentifiers(nodes,existing,new Map([['ion',5]]));
  for(const node of functionClouds)expect(first.records.get(node.id)?.label).toBeDefined();
  expect(first.records.get('time-tx-receipt-amount')?.label).toBeDefined();for(const key of ['notations','opponents','share','notation-0','saved-opponent-2','saved-share-nickname'])expect(first.records.get('saved-view-saved:'+key)?.label).toBeDefined();
  const again=allocateIdentifiers(nodes.map(n=>({...n,name:'A changed amount'})),[...first.records.values()],first.counters);expect(again.added.length).toBe(0);
  expect(again.records.get('time-added')?.label).toBe(first.records.get('time-added')?.label);
  expect(new Set([...first.records.values()].map(n=>n.label)).size).toBe(first.records.size);
 });
 it('keeps all ten game actions represented for all six variants',()=>{for(const variant of ['glinski','mccooey','shafran','brusky','devasa','wellisch'])expect(functionClouds.filter(n=>n.parentId===variant+'-board').length).toBe(10);});
});

describe('Moved Time identifiers',()=>{
 it('keeps existing Activity child ILs when their presentation moves under Time',()=>{const existing:IdentifierRecord[]=[{nodeId:'time',parentId:'ion',label:'IL8',arrivalOrdinal:'8'},{nodeId:'time-added',parentId:'time-activity',label:'IL810',arrivalOrdinal:'0'}];const result=allocateIdentifiers([{id:'time-added',parentId:'time'}],existing,new Map());expect(result.added.length).toBe(0);expect(result.records.get('time-added')?.label).toBe('IL810');});
});
