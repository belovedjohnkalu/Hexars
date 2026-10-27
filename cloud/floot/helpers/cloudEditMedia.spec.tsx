import {cloudEditMedia} from './cloudEditMedia';
import {cloudChanges} from './cloudChanges';
import {schema} from '../endpoints/cloud_POST.schema';
describe('Words and existing media editing',()=>{
 const node={id:'a',parentId:'root',name:'Picture',imageStaticUrls:['/_cdn/static/original.png'],imageKeys:['private/file.png'],mediaTypes:['image/png','image/png'],mediaDimensions:[{width:400,height:600},{width:800,height:800}]},request={action:'update' as const,scope:'private' as const,workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'0'.repeat(64),id:'a',name:'',version:1,photoMode:'keep' as const};
 it('preserves selected canonical files and appends only verified new uploads',()=>{const value=cloudEditMedia(node,{...request,photoMode:'replace',retainMedia:[0],images:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',contentType:'image/png',dimensions:{width:300,height:600}}]},['new/verified.png']);expect(value.imageStaticUrls).toEqual(['/_cdn/static/original.png']);expect(value.imageKeys).toEqual(['new/verified.png']);expect(value.mediaDimensions).toEqual([{width:400,height:600},{width:300,height:600}]);});
 it('rejects missing, duplicate or reordered retained references',()=>{for(const retainMedia of[[2],[0,0],[1,0]])expect(()=>cloudEditMedia(node,{...request,retainMedia},[])).toThrowError(/media changed/);});
 it('allows picture-only creation without inventing a filename label and rejects empty words-only creation',()=>{const base={scope:'private',workspaceId:request.workspaceId,accessToken:request.accessToken,action:'add',id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',parentId:'root',name:'',version:0};expect(schema.safeParse({...base,images:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',contentType:'image/png'}]}).success).toBeTrue();expect(schema.safeParse(base).success).toBeFalse();});
 it('cannot remove the final media and leave an empty cloud',()=>{expect(()=>cloudChanges.apply([node],{...request,photoMode:'remove'},1)).toThrowError(/words or media/);});
});
