import type {CloudNode,InputType} from '../endpoints/cloud_POST.schema';
export function cloudEditMedia(node:CloudNode,input:Extract<InputType,{action:'update'}>,verified:string[]){
 if(input.photoMode==='keep'&&input.retainMedia===undefined)return{};
 const privateKeys=node.imageKeys?.length?node.imageKeys:node.imageKey?[node.imageKey]:[],statics=node.imageStaticUrls||(!privateKeys.length?node.imageUrls|| (node.imageUrl?[node.imageUrl]:[]):[]),all=[...statics.map(url=>({url,key:''})),...privateKeys.map(key=>({key,url:''}))];
 const retained=input.photoMode==='remove'?[]:input.retainMedia??[],seen=new Set<number>();
 if(retained.some((i,j)=>!Number.isSafeInteger(i)||i<0||i>=all.length||seen.has(i)||(seen.add(i),j>0&&i<=retained[j-1])))throw Object.assign(new Error('The media changed. Open this cloud again.'),{status:409});
 return{imageKey:undefined,imageUrl:undefined,imageUrls:undefined,imageKeys:[...retained.flatMap(i=>all[i].key?[all[i].key]:[]),...verified],imageStaticUrls:retained.flatMap(i=>all[i].url?[all[i].url]:[]),isImage:retained.length+verified.length>0,mediaTypes:[...retained.map(i=>node.mediaTypes?.[i]||'image/png'),...verified.map((_,i)=>input.images?.[i]?.contentType||'image/png')],mediaDimensions:[...retained.map(i=>node.mediaDimensions?.[i]||null),...verified.map((_,i)=>input.images?.[i]?.dimensions||null)]};
}
