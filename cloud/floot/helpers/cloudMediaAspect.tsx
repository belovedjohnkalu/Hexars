import type {CloudNode} from '../endpoints/cloud_POST.schema';
export type MediaDimensions={width:number;height:number};
export function cloudMediaAspect(node:Pick<CloudNode,'mediaDimensions'|'mediaTypes'|'imageUrls'|'imageKeys'|'imageUrl'|'imageKey'>){
 const count=Math.max(node.imageUrls?.length||0,node.imageKeys?.length||0,node.imageUrl||node.imageKey?1:0),d=node.mediaDimensions?.[0];
 return count===1&&d&&Number.isFinite(d.width)&&Number.isFinite(d.height)&&d.width>0&&d.height>0?Math.max(.08,Math.min(12.5,d.width/d.height)):1;
}
export async function readMediaDimensions(file:File):Promise<MediaDimensions|undefined>{
 if(!file.type.startsWith('image/')||typeof URL.createObjectURL!=='function')return;
 const url=URL.createObjectURL(file);try{return await new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve(undefined),2000);image.onload=()=>{clearTimeout(timer);resolve(image.naturalWidth&&image.naturalHeight?{width:image.naturalWidth,height:image.naturalHeight}:undefined);};image.onerror=()=>{clearTimeout(timer);resolve(undefined);};image.src=url;});}finally{URL.revokeObjectURL(url);}
}
