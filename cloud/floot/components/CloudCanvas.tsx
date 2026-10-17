import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Image as PictureIcon } from "lucide-react";
import { cloudTree } from "../helpers/cloudTree";
import { cloudLayout } from "../helpers/cloudLayout";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
import { SpatialViewport } from "./SpatialViewport";
import { BoardPreview } from "./BoardPreview";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "./ContextMenu";
import styles from "./CloudCanvas.module.css";
function Picture({node,size,onError}:{node:CloudNode;size:number;onError?:()=>void}){
 const [failed,setFailed]=useState(false),retried=useRef(false);useEffect(()=>setFailed(false),[node.imageUrl]);
 return <span className={styles.pictureFrame} style={{width:size,height:size}}>{node.destination==="glinski"||node.destination==="mccooey"?<BoardPreview variant={node.destination}/>:node.imageUrl&&!failed?<img src={node.imageUrl} alt="" draggable={false} width={size} height={size} onError={()=>{setFailed(true);if(!retried.current){retried.current=true;onError?.();}}}/>:<span className={styles.pictureFallback} role="img" aria-label="Picture unavailable"><PictureIcon size={26}/></span>}</span>;
}
export function CloudCanvas({nodes,parentId,onOpen,opening,loading,addedId,onPictureError,onAction,canEdit=true}:{nodes:CloudNode[];parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void;canEdit?:boolean;onAction?:(node:CloudNode,action:"rename"|"remove"|"move"|"copy")=>void}){
 const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0),location=useLocation();
 useEffect(()=>{const el=area.current;if(!el)return;const observer=new ResizeObserver(()=>setSize({width:Math.max(240,el.clientWidth),height:Math.max(240,el.clientHeight)}));observer.observe(el);let alive=true;void document.fonts.ready.then(()=>{if(alive)setFontReady(1);});return()=>{alive=false;observer.disconnect();};},[]);
 const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId),[nodes,parentId]);
 const layout=useMemo(()=>{const context=document.createElement("canvas").getContext("2d"),width=Math.max(size.width,Math.min(2400,Math.sqrt(siblings.length)*100));return {width,...cloudLayout(siblings,width,size.height,(text,font)=>{if(!context)return text.length*font*.54;context.font="500 "+font+"px Inter, sans-serif";return context.measureText(text).width;})};},[siblings,size,fontReady]);
 const rectangles=new Map(layout.items.map(n=>[n.id,n]));
 function destination(node:CloudNode){
  const back=new URLSearchParams(location.search).get("return");
  if(node.destination==="tactical"){return back==="glinski"||back==="mccooey"?"/"+back+"?mode=engine":"/?cloud=boards";}
  if(node.destination==="glinski"||node.destination==="mccooey"){let mode="friend";try{if(localStorage.getItem("ion.engine")==="tactical")mode="engine";}catch{}return "/"+node.destination+"?mode="+mode;}
  return "/?cloud="+encodeURIComponent(node.id)+(back?"&return="+encodeURIComponent(back):"");
 }
 return <div ref={area} className={styles.viewport}><SpatialViewport width={layout.width} height={layout.height} viewKey={parentId||"root"}>
  <div className={styles.canvas+(opening?" "+styles.leaving:"")} role="group" aria-label={parentId?"Droplets":"Clouds"} aria-busy={loading} style={{width:layout.width,height:layout.height}}>
   {siblings.map(node=>{const rect=rectangles.get(node.id);if(!rect)return null;const url=destination(node),picture=node.isImage||!!node.imageUrl,editable=true;
    const word=<Link to={url} onClick={e=>{if(node.destination==="tactical")try{localStorage.setItem("ion.engine","tactical");}catch{}onOpen(e,node.id,url);}} className={[styles.node,picture?styles.picture:"",opening&&opening!==node.id?styles.fading:"",node.id===addedId?styles.justAdded:""].join(" ")} data-node-id={node.id} data-percent={node.percent} data-descendants={node.count} aria-label={node.name} aria-description={node.destination?"Open "+node.name:node.count+" droplets inside. Hold for options."} style={{"--node-x":rect.x+"px","--node-y":rect.y+"px",width:rect.width,minHeight:rect.height,fontSize:rect.fontSize} as CSSProperties}>{picture?<><Picture node={node} size={rect.width-24} onError={onPictureError}/><span className={styles.caption}>{node.name}</span></>:<span>{node.name}</span>}</Link>;
    return editable&&onAction?<ContextMenu key={node.id}><ContextMenuTrigger asChild>{word}</ContextMenuTrigger><ContextMenuContent className={styles.context} onCloseAutoFocus={e=>{if(document.querySelector('[role="dialog"]'))e.preventDefault();}}>{([['rename','Edit'],['move','Move'],['copy','Copy'],['remove','Delete']] as const).map(([action,label])=><ContextMenuItem key={action} disabled={!canEdit} className={action==='remove'?styles.danger:undefined} onSelect={()=>onAction(node,action)}>{label}</ContextMenuItem>)}</ContextMenuContent></ContextMenu>:<span key={node.id}>{word}</span>;
   })}
   {!siblings.length&&!loading&&<p className={styles.empty}>Add a word or picture.</p>}
  </div>
 </SpatialViewport></div>;
}
