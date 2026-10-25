import {renamedSharedRoot} from './sharedRootNameProjection';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
describe('Shared chapter rename projection',()=>{
 it('changes only the common label, preserving location, picture, rights and permanent identity',()=>{const root:CloudNode={id:'hexagonal-chess',parentId:'custom-group',name:'Old',imageUrl:'/photo.png',identifier:'IL01',createdBy:1},privateNode:CloudNode={id:'private-note',parentId:'custom-group',name:'Keep'};const result=renamedSharedRoot([root,privateNode],'Board Games');expect(result[0]).toEqual({...root,name:'Board Games',contentEdits:['name']});expect(result[1]).toBe(privateNode);expect(root.name).toBe('Old');});
});
