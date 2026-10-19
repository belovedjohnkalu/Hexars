import { useEffect,useRef,useState } from 'react';
import { Image as PictureIcon } from 'lucide-react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { chessVariants } from '../helpers/chessVariants';
import { SavedBoardPreview } from './SavedBoardPreview';
import { BoardPreview } from './BoardPreview';
import styles from './CloudPhoto.module.css';
export function CloudPhoto({node,size,onError,className=''}:{node:CloudNode;size:number;onError?:()=>void;className?:string}){
 const urls=cloudPhotoUrls(node),[failed,setFailed]=useState<Set<string>>(new Set()),retried=useRef(false);
 useEffect(()=>setFailed(new Set()),[urls.join('|')]);
 return <span className={styles.frame+' '+className} style={{width:size,height:size}} data-photo-count={urls.length}>
 {node.savedGameId?<SavedBoardPreview gameId={node.savedGameId} shareId={node.shareId}/>:chessVariants.isId(node.destination)?<BoardPreview variant={node.destination}/>:node.isImage&&node.variant?<BoardPreview variant={node.variant}/>:urls.length?<span className={styles.collage} style={{gridTemplateColumns:`repeat(${Math.ceil(Math.sqrt(urls.length))},minmax(0,1fr))`}}>{urls.map((url,i)=>failed.has(url)?<span key={i} className={styles.fallback} role="img" aria-label="Picture unavailable"><PictureIcon size={24}/></span>:<img key={i} src={url} alt="" draggable={false} onError={()=>{setFailed(old=>new Set([...old,url]));if(!retried.current){retried.current=true;onError?.();}}}/>)}</span>:<span className={styles.fallback} role="img" aria-label="Picture unavailable"><PictureIcon size={26}/></span>}
 </span>;
}
