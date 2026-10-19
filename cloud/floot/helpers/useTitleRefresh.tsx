import { useEffect,useRef,useState,type PointerEvent,type KeyboardEvent,type MouseEvent } from 'react';
import { CLOUD_HOLD_MS } from './useCloudHold';
export function useTitleRefresh(onHold?:()=>void){
 const origin=useRef<{x:number;y:number;pointer:number;held?:boolean}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),callback=useRef(onHold),[refreshing,setRefreshing]=useState(false);callback.current=onHold;
 const cancel=()=>clearTimeout(timer.current);useEffect(()=>cancel,[]);
 return {refreshing,handlers:{
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{cancel();if(!e.isPrimary||e.button!==0){origin.current=null;return;}e.preventDefault();origin.current={x:e.clientX,y:e.clientY,pointer:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);if(callback.current)timer.current=setTimeout(()=>{if(origin.current){origin.current.held=true;callback.current?.();}},CLOUD_HOLD_MS);},
  onPointerMove:(e:PointerEvent<HTMLElement>)=>{const p=origin.current;if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)cancel();},
  onPointerUp:(e:PointerEvent<HTMLElement>)=>{cancel();const start=origin.current;origin.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(start&&!start.held&&start.pointer===e.pointerId&&e.clientY-start.y>72&&Math.abs(e.clientX-start.x)<40&&!refreshing){setRefreshing(true);window.location.reload();}},
  onPointerCancel:()=>{cancel();origin.current=null;},
  onContextMenu:(e:MouseEvent<HTMLElement>)=>{e.preventDefault();cancel();callback.current?.();},
  onKeyDown:(e:KeyboardEvent<HTMLElement>)=>{if(callback.current&&(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey)){e.preventDefault();callback.current();}}
 }};
}
