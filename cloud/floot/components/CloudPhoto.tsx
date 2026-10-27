import {cloudMediaAspect} from '../helpers/cloudMediaAspect';
import { useEffect,useRef,useState } from 'react';
import { Image as PictureIcon,Play,AudioLines } from 'lucide-react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { cloudPhotoUrls,mediaKind } from '../helpers/cloudPhotos';
import { chessVariants } from '../helpers/chessVariants';
import { SavedBoardPreview } from './SavedBoardPreview';
import { BoardPreview } from './BoardPreview';
import {CachedCloudImage} from './CachedCloudImage';
import styles from './CloudPhoto.module.css';
export function CloudPhoto({node,size,onError,onDimensions,className='' }:{node:CloudNode;size:number;onError?:()=>void;onDimensions?:(value:{width:number;height:number})=>void;className?:string}){
 const urls=cloudPhotoUrls(node),[failed,setFailed]=useState<Set<string>>(new Set()),retried=useRef(false);
 useEffect(()=>setFailed(new Set()),[urls.join('|')]);
 return <span className={styles.frame+' '+className} style={{width:cloudMediaAspect(node)<1?size*cloudMediaAspect(node):size,height:cloudMediaAspect(node)>1?size/cloudMediaAspect(node):size}} data-photo-count={urls.length}>
 {node.savedGameId?<SavedBoardPreview gameId={node.savedGameId} shareId={node.shareId}/>:chessVariants.isId(node.destination)?<BoardPreview variant={node.destination}/>:node.isImage&&node.variant?<BoardPreview variant={node.variant}/>:urls.length?<span className={styles.collage} style={{gridTemplateColumns:`repeat(${Math.ceil(Math.sqrt(urls.length))},minmax(0,1fr))`}}>{urls.map((url,i)=>mediaKind(node.mediaTypes?.[i]||'')!=='image'?<span key={i} className={styles.fallback} role="img" aria-label={mediaKind(node.mediaTypes?.[i]||'')}>{mediaKind(node.mediaTypes?.[i]||'')==='video'?<Play size={Math.max(28,size*.25)}/>:<AudioLines size={Math.max(28,size*.25)}/>}</span>:failed.has(url)?<span key={i} className={styles.fallback} role="img" aria-label="Picture unavailable"><PictureIcon size={24}/></span>:<CachedCloudImage key={i} src={url} alt="" onLoad={e=>{if(urls.length===1&&e.currentTarget.naturalWidth&&e.currentTarget.naturalHeight)onDimensions?.({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight});}} draggable={false} onError={()=>{setFailed(old=>new Set([...old,url]));if(!retried.current){retried.current=true;onError?.();}}}/>)}</span>:<span className={styles.fallback} role="img" aria-label="Picture unavailable"><PictureIcon size={26}/></span>}
 </span>;
}
