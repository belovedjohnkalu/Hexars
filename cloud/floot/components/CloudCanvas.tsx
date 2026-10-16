import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { cloudTree } from "../helpers/cloudTree";
import { cloudLayout } from "../helpers/cloudLayout";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
import styles from "./CloudCanvas.module.css";
export function CloudCanvas({nodes,parentId,onOpen,opening,loading}:{
  nodes:CloudNode[];parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;
}) {
  const area=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:360,height:480});
  const [fontReady,setFontReady]=useState(0);
  useEffect(()=>{
    const target=area.current;if(!target)return;
    const observer=new ResizeObserver(()=>{const width=target.clientWidth;const available=(target.parentElement?.clientHeight||480)-target.offsetTop;setSize(previous=>previous.width===Math.max(260,width)&&previous.height===Math.max(380,available)?previous:{width:Math.max(260,width),height:Math.max(380,available)});});
    observer.observe(target);if(target.parentElement)observer.observe(target.parentElement);let active=true;
    void document.fonts.ready.then(()=>{if(active)setFontReady(1);});
    return()=>{active=false;observer.disconnect();};
  },[]);
  const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId),[nodes,parentId]);
  const layout=useMemo(()=>{
    const context=document.createElement("canvas").getContext("2d");
    const measure=(text:string,size:number)=>{if(!context)return text.length*size*.54;context.font="500 "+size+"px Inter, sans-serif";return context.measureText(text).width;};
    return cloudLayout(siblings,size.width,Math.max(380,size.height),measure);
  },[siblings,size,fontReady]);
  function destination(node:CloudNode) {
    if (!node.destination) return "/?cloud="+encodeURIComponent(node.id);
    let variant="glinski";try{if(localStorage.getItem("ion.board.variant")==="mccooey")variant="mccooey";}catch{}
    return "/"+variant+"?mode=friend";
  }
  const focus=layout.items.find(n=>n.id===opening);
  return <div ref={area} className={styles.viewport}>
    <div key={parentId||"root"} className={`${styles.canvas} ${opening?styles.leaving:""}`} aria-label={parentId?"Droplets":"Clouds"} aria-busy={loading} style={{height:layout.height,transformOrigin:focus?`${focus.x+focus.width/2}px ${focus.y+focus.height/2}px`:"50% 50%"}}>
      {siblings.map(node=>{
        const rect=layout.items.find(item=>item.id===node.id);if(!rect)return null;
        const url=destination(node);
        return <Link key={node.id} to={url} onClick={e=>onOpen(e,node.id,url)} className={`${styles.node} ${node.imageUrl?styles.picture:""} ${opening&&opening!==node.id?styles.fading:""}`} data-node-id={node.id} data-percent={node.percent} data-descendants={node.count} aria-label={node.name} style={{"--node-x":rect.x+"px","--node-y":rect.y+"px",width:rect.width,minHeight:rect.height,fontSize:rect.fontSize} as CSSProperties}>
          {node.imageUrl?<><img src={node.imageUrl} alt="" draggable={false} style={{width:rect.width-24,height:rect.width-24}}/><span className={styles.caption}>{node.name}</span></>:<span>{node.name}</span>}
        </Link>;
      })}
      {!siblings.length&&!loading&&<p className={styles.empty}>Your next thought.</p>}
    </div>
  </div>;
}
