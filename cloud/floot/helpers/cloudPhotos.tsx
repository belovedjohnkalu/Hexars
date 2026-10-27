import { cloudPhotoMaxBytes } from './cloudPhotoMaxBytes';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export type CloudPhotoDraft={id:string;file:File;uploaded?:boolean;uploadedFor?:string;dimensions?:{width:number;height:number}};
export const imageTypes=['image/png','image/jpeg','image/webp','image/gif'] as const;
export const photoTypes=[...imageTypes,'video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4','audio/x-m4a','audio/ogg','audio/wav','audio/x-wav','audio/webm'] as const;
export type PhotoType=typeof photoTypes[number];
export const mediaKind=(type:string)=>type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':'image';
export const mediaWordCost=(type:string)=>mediaKind(type)==='video'?1000000:mediaKind(type)==='audio'?500000:1000;
export const mediaMaxBytes=(type:string)=>mediaKind(type)==='video'?200*1024*1024:mediaKind(type)==='audio'?100*1024*1024:cloudPhotoMaxBytes;
export const mediaAccept=photoTypes.join(',');
export function cloudMediaWords(node:CloudNode){const count=Math.max(node.imageKeys?.length||0,node.imageUrls?.length||0,node.imageKey||node.imageUrl||node.isImage?1:0);return Array.from({length:count},(_,i)=>mediaWordCost(node.mediaTypes?.[i]||'image/png')).reduce((a,b)=>a+b,0);}
export function photoFileError(file:File){return !file.size?'This file is empty.':!photoTypes.includes(file.type as PhotoType)?'Choose JPEG, PNG, WebP or GIF; MP4 or WebM video; or MP3, M4A, Ogg or WAV audio.':file.size>mediaMaxBytes(file.type)?'Choose a '+mediaKind(file.type)+' of '+Math.round(mediaMaxBytes(file.type)/1024/1024)+' MB or less.':null;}

export function cloudPhotoUrls(node:CloudNode){return node.imageUrls?.length?node.imageUrls:node.imageUrl?[node.imageUrl]:[];}
export function imageSignature(bytes:Uint8Array,type:PhotoType){const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));if(type.startsWith('video/')||type.startsWith('audio/')){if(type.includes('webm'))return bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163;if(type.includes('mp4')||type.includes('m4a')||type==='video/quicktime')return ascii(4,8)==='ftyp'&&bytes.length>=12;if(type==='audio/ogg')return ascii(0,4)==='OggS';if(type.includes('wav'))return ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE';if(type==='audio/mpeg')return ascii(0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224;return false;}return type==='image/png'?bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10:type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/gif'?['GIF87a','GIF89a'].includes(ascii(0,6)):ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';}
export async function mapPhotos<T,R>(items:T[],work:(item:T,index:number)=>Promise<R>){const results:R[]=[];let next=0;await Promise.all(Array.from({length:Math.min(3,items.length)},async()=>{while(next<items.length){const index=next++;results[index]=await work(items[index],index);}}));return results;}

export function canViewCloudPhoto(node:CloudNode){return cloudPhotoUrls(node).length>0||!!node.savedGameId||!!node.isImage&&!!node.variant||['glinski','mccooey','shafran','brusky','devasa','wellisch'].includes(node.destination||'');}
