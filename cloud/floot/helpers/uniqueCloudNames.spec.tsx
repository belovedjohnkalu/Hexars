import {uniqueCloudNames} from './uniqueCloudNames';
describe('Exact sibling words',()=>{
 const a={id:'a',parentId:'root',name:'Hello'},b={id:'b',parentId:'root',name:'Other'};
 it('rejects a new identical sibling, rename, duplicate and restored collision',()=>{for(const before of[[a],[a,b],[a,{...b,name:'Hello',removedBy:'deleted'}]])expect(()=>uniqueCloudNames(before,[a,{...b,name:'Hello'}])).toThrowError(/already here/);});
 it('permits different parents, case-sensitive words and separate picture-only clouds',()=>{expect(()=>uniqueCloudNames([a],[a,{...b,parentId:'other',name:'Hello'}])).not.toThrow();expect(()=>uniqueCloudNames([a],[a,{...b,name:'hello'}])).not.toThrow();expect(()=>uniqueCloudNames([],[{...a,name:'',isImage:true},{...b,name:'',isImage:true}])).not.toThrow();});
 it('does not rewrite old duplicates or mistake an overridden seed for a sibling',()=>{const before=[a,{...b,name:'Hello'}];expect(()=>uniqueCloudNames(before,before.map(n=>({...n,color:'blue' as const})))).not.toThrow();expect(()=>uniqueCloudNames([a],[a,{...a,name:'Edited'}])).not.toThrow();});
});
