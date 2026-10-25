import type {CloudNode} from '../endpoints/cloud_POST.schema';
import {cloudPhotoUrls} from '../helpers/cloudPhotos';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './Dialog';
import {PagedText} from './PagedText';
import {CloudPhoto} from './CloudPhoto';
import {colorValue} from '../helpers/cloudColors';
import {CloudPhotoViewer} from './CloudPhotoViewer';
import {RuleDiagram} from './RuleDiagram';
import {Button} from './Button';
import {useState} from 'react';
import styles from './CloudContentViewer.module.css';
export function CloudContentViewer({node,onClose}:{node:CloudNode;onClose:()=>void}){
 const[photos,setPhotos]=useState(false),hasPhotos=cloudPhotoUrls(node).length>0||!!node.savedGameId||!!node.isImage;
 if(photos)return <CloudPhotoViewer node={node} onClose={()=>setPhotos(false)}/>;
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className={styles.viewer}><DialogTitle className={styles.title}>Cloud</DialogTitle><DialogDescription className={styles.sr}>Full content. Droplets stay on the previous page.</DialogDescription><div className={styles.content} style={{color:colorValue(node.color)}}><PagedText text={node.name+(node.note?'\n\n'+node.note:'')}/></div>{node.illustration&&node.variant&&<div className={styles.diagram}><RuleDiagram kind={node.illustration} variant={node.variant}/></div>}{hasPhotos&&<Button variant="ghost" className={styles.picture} aria-label="View pictures" onClick={()=>setPhotos(true)}><CloudPhoto node={node} size={220}/></Button>}</DialogContent></Dialog>;
}
