import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Image as PictureIcon } from "lucide-react";
import { cloudTree } from "../helpers/cloudTree";
import { cloudLayout } from "../helpers/cloudLayout";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
import styles from "./CloudCanvas.module.css";
function Picture({node,size,onError}:{node:CloudNode;size:number;onError?:()=>void}){
  const [failed,setFailed]=useState(false),retried=useRef(false);
  useEffect(()=>setFailed(false),[node.imageUrl]);
  return <span className={styles.pictureFrame} style={{width:size,height:size}}>
    {node.imageUrl&&!failed?<img src={node.imageUrl} alt="" draggable={false} width={size} height={size} onError={()=>{setFailed(true);if(!retried.current){retried.current=true;onError?.();}}}/>:<span className={styles.pictureFallback} role="img" aria-label="Picture unavailable"><PictureIcon size={32} strokeWidth={1.3}/></span>}
  </span>;
}
export function CloudCanvas({nodes,parentId,onOpen,opening,loading,addedId,onPictureError}:{nodes:CloudNode[];parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void}){
  const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0);
  useEffect(()=>{
    const target=area.current;if(!target)return;
    const observer=new ResizeObserver(()=>{const width=target.clientWidth,available=(target.parentElement?.clientHeight||480)-target.offsetTop,next={width:Math.max(240,width),height:Math.max(300,available)};setSize(previous=>previous.width===next.width&&previous.height===next.height?previous:next);});
    observer.observe(target);if(target.parentElement)observer.observe(target.parentElement);let active=true;
    void document.fonts.ready.then(()=>{if(active)setFontReady(1);});return()=>{active=false;observer.disconnect();};
  },[]);
  const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId),[nodes,parentId]);
  const layout=useMemo(()=>{
    const context=document.createElement("canvas").getContext("2d");
    const measure=(text:string,size:number)=>{if(!context)return text.length*size*.54;context.font="500 "+size+"px Inter, sans-serif";return context.measureText(text).width;};
    return cloudLayout(siblings,size.width,size.height,measure);
  },[siblings,size,fontReady]);
  function destination(node:CloudNode){if(!node.destination)return "/?cloud="+encodeURIComponent(node.id);let variant="glinski";try{if(localStorage.getItem("ion.board.variant")==="mccooey")variant="mccooey";}catch{}return "/"+variant+"?mode=friend";}
  const focus=layout.items.find(n=>n.id===opening);
  return <div ref={area} className={styles.viewport}>
    <div key={parentId||"root"} className={styles.canvas+(opening?" "+styles.leaving:"")} role="group" aria-label={parentId?"Droplets":"Clouds"} aria-busy={loading} style={{height:layout.height,transformOrigin:focus?focus.x+focus.width/2+"px "+(focus.y+focus.height/2)+"px":"50% 50%"}}>
      {siblings.map(node=>{
        const rect=layout.items.find(item=>item.id===node.id);if(!rect)return null;const url=destination(node),picture=node.isImage||!!node.imageUrl;
        return <Link key={node.id} to={url} onClick={e=>onOpen(e,node.id,url)} className={[styles.node,picture?styles.picture:"",opening&&opening!==node.id?styles.fading:"",node.id===addedId?styles.justAdded:""].join(" ")} data-node-id={node.id} data-percent={node.percent} data-descendants={node.count} aria-label={node.name} aria-description={node.destination?"Open pass-and-play":node.count+" "+(node.count===1?"droplet":"droplets")+" inside"} style={{"--node-x":rect.x+"px","--node-y":rect.y+"px",width:rect.width,minHeight:rect.height,fontSize:rect.fontSize} as CSSProperties}>
          {picture?<><Picture node={node} size={rect.width-24} onError={onPictureError}/><span className={styles.caption}>{node.name}</span></>:<span>{node.name}</span>}
        </Link>;
      })}
      {!siblings.length&&!loading&&<p className={styles.empty}>Add a word or picture.</p>}
    </div>
  </div>;
}
