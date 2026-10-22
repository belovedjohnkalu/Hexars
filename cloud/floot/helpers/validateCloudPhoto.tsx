import { cloudPhotoMaxBytes } from './cloudPhotoMaxBytes';
import { getInfo,getUrl } from '@floot/storage';
import { imageSignature,type PhotoType } from './cloudPhotos';
export async function validateCloudPhoto(filename:string,type:PhotoType){
 const info=await getInfo({visibility:'private',filename});
 if(!info.ok||!info.exists||info.sizeBytes===0||info.sizeBytes>cloudPhotoMaxBytes)throw Object.assign(new Error('Upload the picture again.'),{status:400});
 const url=await getUrl({visibility:'private',filename,expiresInSeconds:60});
 if(!url.ok)throw Object.assign(new Error('Couldn’t read that picture. Try again.'),{status:400});
 const response=await fetch(url.url,{headers:{Range:'bytes=0-15'},signal:AbortSignal.timeout(10000)});
 if(!response.ok||!imageSignature(new Uint8Array(await response.arrayBuffer()),type))throw Object.assign(new Error('Choose a valid JPEG, PNG, WebP or GIF picture.'),{status:400});
 return filename;
}
