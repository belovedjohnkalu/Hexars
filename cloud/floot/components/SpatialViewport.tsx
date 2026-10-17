import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import styles from "./SpatialViewport.module.css";
type View={zoom:number;x:number;y:number};
const views=new Map<string,View>();
export function SpatialViewport({children,width,height,viewKey,label="Word space"}:{children:ReactNode;width:number;height:number;viewKey:string;label?:string}){
 const viewport=useRef<HTMLDivElement>(null),[zoom,setZoom]=useState(views.get(viewKey)?.zoom||1),zoomRef=useRef(zoom),points=useRef(new Map<number,{x:number;y:number}>()),last=useRef<{x:number;y:number;distance?:number}|null>(null),moved=useRef(false),origin=useRef<{x:number;y:number}|null>(null);
 const setScale=(next:number,cx?:number,cy?:number)=>{
  const el=viewport.current;if(!el)return;next=Math.max(.4,Math.min(2.5,next));const before=zoomRef.current,b=el.getBoundingClientRect(),x=cx===undefined?el.clientWidth/2:cx-b.left,y=cy===undefined?el.clientHeight/2:cy-b.top;
  const left=(el.scrollLeft+x)/before*next-x,top=(el.scrollTop+y)/before*next-y;zoomRef.current=next;setZoom(next);requestAnimationFrame(()=>{el.scrollLeft=left;el.scrollTop=top;});
 };
 useEffect(()=>{
  const el=viewport.current;if(!el)return;const saved=views.get(viewKey);const value=saved?.zoom||1;zoomRef.current=value;setZoom(value);
  requestAnimationFrame(()=>{el.scrollLeft=saved?.x??0;el.scrollTop=saved?.y??0;});
  const wheel=(e:WheelEvent)=>{if(e.ctrlKey||e.metaKey||e.altKey){e.preventDefault();setScale(zoomRef.current*Math.exp(-e.deltaY*.006),e.clientX,e.clientY);}};
  el.addEventListener("wheel",wheel,{passive:false});return()=>{views.set(viewKey,{zoom:zoomRef.current,x:el.scrollLeft,y:el.scrollTop});el.removeEventListener("wheel",wheel);};
 },[viewKey]);
 function down(e:PointerEvent<HTMLDivElement>){
  if(e.button!==0||(e.target as HTMLElement).closest('[data-no-pan],button,input,[role="menu"]'))return;
  points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.current.size===1){moved.current=false;origin.current={x:e.clientX,y:e.clientY};}
  last.current=sample();
 }
 function sample():{x:number;y:number;distance?:number}|null{const p=[...points.current.values()];if(!p.length)return null;return p.length===1?p[0]:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)};}
 function move(e:PointerEvent<HTMLDivElement>){
  if(!points.current.has(e.pointerId))return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const now=sample(),before=last.current,el=viewport.current;if(!now||!before||!el)return;
  if(points.current.size>1||Math.hypot(e.clientX-(origin.current?.x||e.clientX),e.clientY-(origin.current?.y||e.clientY))>8)moved.current=true;
  if(moved.current){el.setPointerCapture(e.pointerId);el.scrollLeft-=now.x-before.x;el.scrollTop-=now.y-before.y;if(now.distance&&before.distance)setScale(zoomRef.current*now.distance/before.distance,now.x,now.y);}
  last.current=now;
 }
 function up(e:PointerEvent<HTMLDivElement>){points.current.delete(e.pointerId);last.current=sample();if(viewport.current?.hasPointerCapture(e.pointerId))viewport.current.releasePointerCapture(e.pointerId);}
 return <div className={styles.shell}>
  <div ref={viewport} className={styles.viewport} role="region" aria-label={label} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={e=>{if(moved.current){e.preventDefault();e.stopPropagation();moved.current=false;}}} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='+'||e.key==='='){e.preventDefault();setScale(zoomRef.current+.15);}if(e.key==='-'){e.preventDefault();setScale(zoomRef.current-.15);}if(e.key==='0'){e.preventDefault();setScale(1);}}}>
   <div className={styles.extent} style={{width:Math.max(width*zoom,1),height:Math.max(height*zoom,1)}}><div className={styles.world} style={{width,height,transform:`scale(${zoom})`}}>{children}</div></div>
  </div>

 </div>;
}
