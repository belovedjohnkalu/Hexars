import { BoardPreview } from './BoardPreview';
import { SavedBoardPreview } from './SavedBoardPreview';
import { chessVariants } from '../helpers/chessVariants';
import { useState } from 'react';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { cloudPhotoUrls,mediaKind } from '../helpers/cloudPhotos';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { SpatialViewport } from './SpatialViewport';
import {CachedCloudImage} from './CachedCloudImage';
import {CloudMediaPlayback} from './CloudMediaPlayback';
import styles from './CloudPhotoViewer.module.css';
export function CloudPhotoViewer({node,onClose,className=''}:{node:CloudNode;onClose:()=>void;className?:string}){
 const urls=cloudPhotoUrls(node),variant=chessVariants.isId(node.destination)?node.destination:node.variant,dynamic=!!node.savedGameId||!!variant&&!urls.length,[index,setIndex]=useState(0),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false),kind=mediaKind(node.mediaTypes?.[index]||'');
 const change=(next:number)=>{setFailed(false);setLoaded(false);setIndex(Math.max(0,Math.min(urls.length-1,next)));};
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className={styles.viewer+' '+className} onKeyDown={e=>{if(e.defaultPrevented)return;if(e.key==='ArrowLeft')change(index-1);if(e.key==='ArrowRight')change(index+1);}}>
 <DialogTitle className={styles.title}>{node.name}</DialogTitle><DialogDescription className={styles.description}>{urls.length>1?(index+1)+' / '+urls.length:kind==='video'?'Video':kind==='audio'?'Audio':'Photo'}</DialogDescription>
 <div className={styles.image} aria-busy={!dynamic&&kind==='image'&&!loaded&&!failed}>{dynamic?<SpatialViewport width={1000} height={1000} viewKey={'board-photo-'+node.id} label="Picture"><div style={{width:1000,height:1000}}>{node.savedGameId?<SavedBoardPreview gameId={node.savedGameId} shareId={node.shareId}/>:variant?<BoardPreview variant={variant}/>:null}</div></SpatialViewport>:kind!=='image'?<CloudMediaPlayback url={urls[index]} type={node.mediaTypes?.[index]||''} name={node.name}/>:failed?<div role="alert">Picture unavailable.</div>:<SpatialViewport width={1000} height={1000} viewKey={'photo-'+node.id+'-'+index} label="Picture"><CachedCloudImage src={urls[index]} alt={node.name+(urls.length>1?' — photo '+(index+1):'')} draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} width={1000} height={1000}/></SpatialViewport>}{!dynamic&&kind==='image'&&!loaded&&!failed&&<div className={styles.loading}><Spinner size="sm" aria-label="Opening photo"/></div>}</div>
 {urls.length>1&&<nav className={styles.controls} aria-label="Photos"><Button variant="ghost" size="icon" aria-label="Previous photo" disabled={index===0} onClick={()=>change(index-1)}><ChevronLeft size={25}/></Button><span aria-live="polite">{index+1} / {urls.length}</span><Button variant="ghost" size="icon" aria-label="Next photo" disabled={index===urls.length-1} onClick={()=>change(index+1)}><ChevronRight size={25}/></Button></nav>}
 </DialogContent></Dialog>;
}
