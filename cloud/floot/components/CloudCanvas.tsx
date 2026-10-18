import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Image as PictureIcon } from "lucide-react";
import { cloudNames } from "../helpers/cloudNames";
import { chessVariants } from "../helpers/chessVariants";
import { cloudTree } from "../helpers/cloudTree";
import { colorValue } from "../helpers/cloudColors";
import { cloudHomeLayout } from "../helpers/cloudHomeLayout";
import { cloudLayout,type CloudLayout } from "../helpers/cloudLayout";
import type { CloudNode,CloudScope } from "../endpoints/cloud_POST.schema";
import { SpatialViewport } from "./SpatialViewport";
import { BoardPreview } from "./BoardPreview";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "./ContextMenu";
import styles from "./CloudCanvas.module.css";
function Picture({node,size,onError}:{node:CloudNode;size:number;onError?:()=>void}){
 const [failed,setFailed]=useState(false),retried=useRef(false);useEffect(()=>setFailed(false),[node.imageUrl]);
 return <span className={styles.pictureFrame} style={{width:size,height:size}}>{chessVariants.isId(node.destination)?<BoardPreview variant={node.destination}/>:node.imageUrl&&!failed?<img src={node.imageUrl} alt="" draggable={false} width={size} height={size} onError={()=>{setFailed(true);if(!retried.current){retried.current=true;onError?.();}}}/>:<span className={styles.pictureFallback} role="img" aria-label="Picture unavailable"><PictureIcon size={26}/></span>}</span>;
}
export function CloudCanvas({nodes,parentId,onOpen,opening,loading,addedId,onPictureError,onAction,canEdit=true,scope="chess"}:{nodes:CloudNode[];scope?:CloudScope;parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void;canEdit?:boolean;onAction?:(node:CloudNode,action:"rename"|"remove"|"move"|"copy")=>void}){
 const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0),location=useLocation();
 useLayoutEffect(()=>{const el=area.current;if(!el)return;const measure=()=>setSize(old=>({width:Math.max(240,el.clientWidth),height:el.closest('[data-keyboard="true"]')?old.height:Math.max(160,el.clientHeight)}));measure();const observer=new ResizeObserver(measure);observer.observe(el);let alive=true;void document.fonts.ready.then(()=>{if(alive)setFontReady(1);});return()=>{alive=false;observer.disconnect();};},[]);
 const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId).map(n=>n.note?{...n,isImage:false,imageUrl:undefined}:n),[nodes,parentId]);
 const square=scope==='chess'&&(parentId==='rules'||!!parentId?.endsWith('-rules')),lastLayout=useRef<{key:string;viewportWidth:number;layout:CloudLayout}|null>(null),layoutKey=scope+":"+(parentId||"root");
 const layout=useMemo(()=>{
  if(scope==='home')return cloudHomeLayout(size.width,size.height);
  const context=document.createElement("canvas").getContext("2d"),previous=lastLayout.current?.key===layoutKey&&lastLayout.current.viewportWidth===size.width?lastLayout.current.layout:undefined;
  const width=Math.max(previous?.width||0,size.width,square?Math.max(760,Math.ceil(Math.sqrt(siblings.length))*165):Math.min(2400,Math.sqrt(siblings.length)*100));
  return cloudLayout(siblings.map(n=>({...n,name:cloudNames.preview(n.name)})),width,size.height,(text,font)=>{if(!context)return text.length*font*.54;context.font="500 "+font+"px Inter, sans-serif";return context.measureText(text).width;},{square,compact:size.width<600,previous});
 },[siblings,size,fontReady,scope,square,layoutKey]);
 useLayoutEffect(()=>{
  if(!fontReady||loading)return;
  const old=lastLayout.current,retain=old?.key===layoutKey&&old.viewportWidth===size.width&&old.layout.width===layout.width;
  // Keep removed anchors for Undo during this visit; nothing is rendered for them.
  const items=retain?[...new Map([...old.layout.items,...layout.items].map(n=>[n.id,n])).values()]:layout.items;
  lastLayout.current={key:layoutKey,viewportWidth:size.width,layout:{...layout,items}};
 },[layout,size.width,fontReady,loading,layoutKey]);
 const rectangles=new Map(layout.items.map(n=>[n.id,n]));
 function destination(node:CloudNode){
  const query=new URLSearchParams(location.search),back=query.get("return"),context=back?"&return="+encodeURIComponent(back)+"&mode="+(query.get("mode")==="friend"?"friend":"engine")+"&level="+encodeURIComponent(query.get("level")??"3"):"";
  if(node.destination==="level"){const level=node.level??3;return chessVariants.isId(back)?"/"+back+"?mode=engine&level="+level:"/?cloud=boards&level="+level;}
  if(chessVariants.isId(node.destination)){let mode="friend",level="3";try{if(localStorage.getItem("ion.engine")==="tactical"){mode="engine";level=localStorage.getItem("ion.difficulty")||"3";}}catch{}return "/"+node.destination+"?mode="+mode+(mode==="engine"?"&level="+level:"");}
  return "/?cloud="+encodeURIComponent(node.id)+((scope==='public'||scope==='private'||scope==='chess'&&/^[a-f0-9-]{36}$/.test(node.id))?"&space="+scope:"")+context;
 }
 return <div ref={area} className={styles.viewport}><SpatialViewport width={layout.width} height={layout.height} viewKey={scope+":"+(parentId||"root")} ready={!!fontReady&&!loading} refitKey={size.width+":"+size.height} initialZoom={square?1:undefined}>
  <div className={styles.canvas+(opening?" "+styles.leaving:"")} data-home={scope==='home'} role="group" aria-label={parentId?"Droplets":"Clouds"} aria-busy={loading} style={{width:layout.width,height:layout.height,visibility:fontReady&&!(scope==='home'&&loading)?'visible':'hidden'}}>
   {siblings.map(node=>{const rect=rectangles.get(node.id);if(!rect)return null;const url=destination(node),picture=node.isImage||!!node.imageUrl,editable=!!node.canEdit||!!node.canCopy;
    const word=<Link to={url} onClick={e=>{if(node.destination==="level")try{localStorage.setItem("ion.engine","tactical");localStorage.setItem("ion.difficulty",String(node.level??3));}catch{}onOpen(e,node.id,url);}} className={[styles.node,picture?styles.picture:"",opening&&opening!==node.id?styles.fading:"",node.id===addedId?styles.justAdded:""].join(" ")} data-node-id={node.id} data-percent={node.percent} data-descendants={node.count} title={node.name} aria-label={node.name} aria-description={node.destination?"Open "+node.name:node.count+" droplets inside. Hold for options."} style={{color:colorValue(node.color||cloudTree.seed.find(n=>n.id===node.id)?.color),"--node-x":rect.x+"px","--node-y":rect.y+"px",width:rect.width,minHeight:rect.height,fontSize:scope==='home'&&!picture?(size.width<600?17:20)+node.percent/100*(size.width<600?13:18):rect.fontSize} as CSSProperties}>{picture?<><Picture node={node} size={rect.width-24} onError={onPictureError}/><span className={styles.caption}>{cloudNames.preview(node.name)}</span></>:<span>{cloudNames.preview(node.name)}</span>}</Link>;
    return editable&&onAction?<ContextMenu key={node.id}><ContextMenuTrigger asChild>{word}</ContextMenuTrigger><ContextMenuContent className={styles.context} onCloseAutoFocus={e=>{if(document.querySelector('[role="dialog"]'))e.preventDefault();}}>{([['rename','Edit'],['move','Move'],['copy','Copy'],['remove','Delete']] as const).map(([action,label])=><ContextMenuItem key={action} disabled={!canEdit||(action==='copy'?!node.canCopy:!node.canEdit)} className={action==='remove'?styles.danger:undefined} onSelect={()=>onAction(node,action)}>{label}</ContextMenuItem>)}</ContextMenuContent></ContextMenu>:<span key={node.id}>{word}</span>;
   })}
   {!siblings.length&&!loading&&<p className={styles.empty}>{scope==='private'?'Add a word or picture.':'Nothing here yet.'}</p>}
  </div>
 </SpatialViewport></div>;
}
