import { cloudPhotoMaxBytes } from './cloudPhotoMaxBytes';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export type CloudPhotoDraft={id:string;file:File;uploaded?:boolean;uploadedFor?:string};
export const photoTypes=['image/png','image/jpeg','image/webp','image/gif'] as const;
export type PhotoType=typeof photoTypes[number];
export function photoFileError(file:File){return !file.size?'This picture is empty.':!photoTypes.includes(file.type as PhotoType)?'Use JPEG, PNG, WebP or GIF.':file.size>cloudPhotoMaxBytes?'Choose a picture of 20 MB or less.':null;}
export function cloudPhotoUrls(node:CloudNode){return node.imageUrls?.length?node.imageUrls:node.imageUrl?[node.imageUrl]:[];}
export function imageSignature(bytes:Uint8Array,type:PhotoType){const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));return type==='image/png'?bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10:type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/gif'?['GIF87a','GIF89a'].includes(ascii(0,6)):ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';}
export async function mapPhotos<T,R>(items:T[],work:(item:T,index:number)=>Promise<R>){const results:R[]=[];let next=0;await Promise.all(Array.from({length:Math.min(3,items.length)},async()=>{while(next<items.length){const index=next++;results[index]=await work(items[index],index);}}));return results;}

export function canViewCloudPhoto(node:CloudNode){return cloudPhotoUrls(node).length>0||!!node.savedGameId||!!node.isImage&&!!node.variant||['glinski','mccooey','shafran','brusky','devasa','wellisch'].includes(node.destination||'');}
