import { cloudChanges } from './cloudChanges';
import { presentCloudNodes } from './cloudPresentation';
import { schema } from '../endpoints/cloud_POST.schema';
describe('Complete content editor',()=>{
 const node={id:'time',parentId:'ion',name:'Time',imageUrl:'/old.png',note:'Original',createdBy:1,system:true},base={action:'update' as const,id:'time',name:'Clock',note:'Revised',photoMode:'replace' as const,assetId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',version:2,scope:'home' as const,workspaceId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',accessToken:'0'.repeat(64)};
 it('keeps identity and author, replaces pictures only with server-verified keys, and rejects stale writes',()=>{const value=cloudChanges.apply([node],base,2,[],['verified/key.png'])[0];expect(value.id).toBe('time');expect(value.createdBy).toBe(1);expect(value.note).toBe('Revised');expect(value.imageUrl).toBeUndefined();expect(value.imageKeys).toEqual(['verified/key.png']);expect(value.contentEdits).toContain('images');expect(()=>cloudChanges.apply([node],base,3)).toThrow();});
 it('preserves pictures unless explicitly replaced or removed',()=>{expect(cloudChanges.apply([node],{...base,photoMode:'keep'},2)[0].imageUrl).toBe('/old.png');expect(cloudChanges.apply([node],{...base,photoMode:'remove'},2)[0].imageUrl).toBeUndefined();});
 it('keeps all functional routing intact when applying edited labels and pictures',()=>{const [n]=presentCloudNodes([{id:'a',parentId:'x',name:'Send',href:'/send'}],[{id:'a',parentId:'bad',name:'Gift',href:'https://evil.invalid',contentEdits:['name']}]);expect(n.name).toBe('Gift');expect(n.href).toBe('/send');expect(n.parentId).toBe('x');});
 it('discards forged server image keys, author and permissions at the request boundary',()=>{const q=schema.parse({...base,imageKeys:['private/other-account.png'],author:{name:'Forged'},canEdit:true});expect('imageKeys' in q).toBeFalse();expect('author' in q).toBeFalse();expect('canEdit' in q).toBeFalse();});
});
