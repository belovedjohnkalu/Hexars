import { communitySizing } from './communitySizing';
import { cloudTree } from './cloudTree';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Discussion descendants contribute to the ordinary cloud hierarchy',()=>{
  it('uses actual descendant totals without changing names or other branches',()=>{const nodes:CloudNode[]=[{id:'chess-community',parentId:null,name:'Community'},{id:'room-a',parentId:'chess-community',name:'A'},{id:'room-b',parentId:'chess-community',name:'B'},{id:'elsewhere',parentId:null,name:'Elsewhere'}],result=communitySizing.apply(nodes,new Map([['room-a',20],['room-b',40]]));expect(result[1].sizeCharacters).toBe(20);expect(result[2].sizeCharacters).toBe(40);expect(result[3]).toBe(nodes[3]);expect(nodes[1].sizeCharacters).toBeUndefined();expect(cloudTree.descendantCharacterWeights(result).get('chess-community')).toBe(62);});
});
