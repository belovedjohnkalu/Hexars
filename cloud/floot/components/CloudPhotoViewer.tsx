import { useState } from 'react';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import { Button } from './Button';
import { SpatialViewport } from './SpatialViewport';
import styles from './CloudPhotoViewer.module.css';
export function CloudPhotoViewer({node,onClose,className=''}:{node:CloudNode;onClose:()=>void;className?:string}){
 const urls=cloudPhotoUrls(node),[index,setIndex]=useState(0),[failed,setFailed]=useState(false);
 const change=(next:number)=>{setFailed(false);setIndex(Math.max(0,Math.min(urls.length-1,next)));};
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className={styles.viewer+' '+className} onKeyDown={e=>{if(e.defaultPrevented)return;if(e.key==='ArrowLeft')change(index-1);if(e.key==='ArrowRight')change(index+1);}}>
 <DialogTitle className={styles.title}>{node.name}</DialogTitle><DialogDescription className={styles.description}>{urls.length>1?(index+1)+' / '+urls.length:'Photo'}</DialogDescription>
 <div className={styles.image}>{failed?<div role="alert">Picture unavailable.</div>:<SpatialViewport width={1000} height={1000} viewKey={'photo-'+node.id+'-'+index} label="Photo space"><img src={urls[index]} alt={node.name+(urls.length>1?' — photo '+(index+1):'')} draggable={false} onError={()=>setFailed(true)} width={1000} height={1000}/></SpatialViewport>}</div>
 {urls.length>1&&<nav className={styles.controls} aria-label="Photos"><Button variant="ghost" size="icon" aria-label="Previous photo" disabled={index===0} onClick={()=>change(index-1)}><ChevronLeft size={25}/></Button><span aria-live="polite">{index+1} / {urls.length}</span><Button variant="ghost" size="icon" aria-label="Next photo" disabled={index===urls.length-1} onClick={()=>change(index+1)}><ChevronRight size={25}/></Button></nav>}
 </DialogContent></Dialog>;
}
