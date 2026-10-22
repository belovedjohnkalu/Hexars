import { getInfo,getUrl } from '@floot/storage';
import { validateCloudPhoto } from './validateCloudPhoto';
import { cloudPhotoMaxBytes } from './cloudPhotoMaxBytes';
import { schema } from '../endpoints/cloud_POST.schema';
describe('Larger picture server validation',()=>{
 it('allows the new limit in presign requests and rejects larger values',()=>{
 const input={action:'upload',scope:'home',workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64),id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',contentType:'image/jpeg',sizeBytes:cloudPhotoMaxBytes};
 expect(schema.safeParse(input).success).toBeTrue();expect(schema.safeParse({...input,sizeBytes:cloudPhotoMaxBytes+1}).success).toBeFalse();
 });
 it('checks stored size and signature at the new ceiling',async()=>{
 (getInfo as jasmine.Spy).and.resolveTo({ok:true,exists:true,sizeBytes:cloudPhotoMaxBytes});(getUrl as jasmine.Spy).and.resolveTo({ok:true,url:'https://example.invalid/photo'});
 const read=spyOn(globalThis,'fetch').and.resolveTo(new Response(new Uint8Array([255,216,255])));
 expect(await validateCloudPhoto('qa/photo.jpg','image/jpeg')).toBe('qa/photo.jpg');expect(read.calls.mostRecent().args[1]?.headers).toEqual({Range:'bytes=0-15'});
 (getInfo as jasmine.Spy).and.resolveTo({ok:true,exists:true,sizeBytes:cloudPhotoMaxBytes+1});await expectAsync(validateCloudPhoto('qa/photo.jpg','image/jpeg')).toBeRejected();expect(read.calls.count()).toBe(1);
 });
});
