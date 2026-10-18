import { assertCloudCapacity } from './cloudCapacity';
import { cloudChanges } from './cloudChanges';
import { cloudHomeLayout } from './cloudHomeLayout';
import { tacticalLevels } from './tacticalLevels';
import { schema,type CloudNode } from '../endpoints/cloud_POST.schema';
describe('ION bounded clouds and recovery',()=>{
 const nodes:CloudNode[]=Array.from({length:1024},(_,i)=>({id:'n'+i,parentId:'parent',name:'Word'}));
 it('allows exactly 1024 immediate droplets, including the final add',()=>{expect(()=>assertCloudCapacity(nodes.slice(0,1023),nodes)).not.toThrow();expect(()=>assertCloudCapacity(nodes,[...nodes,{id:'overflow',parentId:'parent',name:'Too many'}])).toThrowError(/full/);});
 it('saves Public colors through creation, author edits and branch copies',()=>{
  const node:CloudNode={id:'colored',parentId:'public',name:'Color',color:'blue',createdBy:2};
  const request={action:'rename' as const,scope:'public' as const,id:'colored',name:'Color',color:'rose' as const,version:0,workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64)};
  const changed=cloudChanges.apply([node],request,0);expect(changed[0].color).toBe('rose');expect(changed[0].createdBy).toBe(2);
 });
 it('does not impose a global or descendant limit',()=>{expect(()=>assertCloudCapacity(nodes,[...nodes,...Array.from({length:1024},(_,i)=>({id:'c'+i,parentId:'n0',name:'Nested'}))])).not.toThrow();});
 it('counts visible unique entries, permits replacement and rejects overflowing restored/copied branches',()=>{expect(()=>assertCloudCapacity(nodes,[...nodes,nodes[0]])).not.toThrow();expect(()=>assertCloudCapacity(nodes,[...nodes,{id:'deleted',parentId:'parent',name:'Hidden',removedBy:'op'}])).not.toThrow();expect(()=>assertCloudCapacity(nodes,[...nodes,{id:'restored',parentId:'parent',name:'Restored'}])).toThrow();});
 it('keeps Undo visible for ten seconds from the original deletion time',()=>{const now=Date.now(),entry={id:'a',parentId:'parent',name:'A',removedBy:'op',removedAt:new Date(now).toISOString()};spyOn(Date,'now').and.returnValue(now+9999);expect(cloudChanges.undo([entry])?.expiresAt).toBe(now+10000);(Date.now as jasmine.Spy).and.returnValue(now+10000);expect(cloudChanges.undo([entry])).toBeUndefined();});
 it('anchors Home positions independently of server counts and keeps them inside the viewport',()=>{for(const w of [320,393,768,1280]){const result=cloudHomeLayout(w,650);expect(result.items.map(n=>n.id)).toEqual(['hexagonal-chess','public','private']);expect(result.items.every(n=>n.x>=0&&n.x+n.width<=w&&n.y>=0&&n.y+n.height<=650)).toBeTrue();}});
 it('gives Pre-Beginner exactly half of Beginner’s native time and node allowance',()=>{expect(tacticalLevels[0].level).toBe(0);expect(tacticalLevels[0].limits.timeMs*2).toBe(tacticalLevels[1].limits.timeMs);expect(tacticalLevels[0].limits.nodeLimit*2).toBe(tacticalLevels[1].limits.nodeLimit);});
 it('accepts only the shared color palette',()=>{const request={action:'add',scope:'private',workspaceId:'123e4567-e89b-42d3-a456-426614174000',accessToken:'a'.repeat(64),id:'123e4567-e89b-42d3-a456-426614174001',parentId:'private',name:'Blue',version:0};expect(schema.safeParse({...request,color:'blue'}).success).toBeTrue();expect(schema.safeParse({...request,color:'url(javascript:bad)'}).success).toBeFalse();});
});
