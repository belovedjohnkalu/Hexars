import { getInfo,getUrl } from '@floot/storage';
import { imageSignature,mediaMaxBytes,type PhotoType } from './cloudPhotos';
export async function validateCloudPhoto(filename:string,type:PhotoType){
 const info=await getInfo({visibility:'private',filename});
 if(!info.ok||!info.exists||info.sizeBytes===0||info.sizeBytes>mediaMaxBytes(type))throw Object.assign(new Error('Upload the file again.'),{status:400});
 const url=await getUrl({visibility:'private',filename,expiresInSeconds:60});
 if(!url.ok)throw Object.assign(new Error('Couldn’t read that file. Try again.'),{status:400});
 const response=await fetch(url.url,{headers:{Range:'bytes=0-15'},signal:AbortSignal.timeout(10000)});
 if(!response.ok||!imageSignature(new Uint8Array(await response.arrayBuffer()),type))throw Object.assign(new Error('The file does not match its format.'),{status:400});
 return filename;
}
