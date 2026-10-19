import { useRef,useState,type PointerEvent } from 'react';
export function useTitleRefresh(){
 const origin=useRef<{x:number;y:number;pointer:number}|null>(null),[refreshing,setRefreshing]=useState(false);
 return {refreshing,handlers:{
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{if(!e.isPrimary||e.button!==0){origin.current=null;return;}origin.current={x:e.clientX,y:e.clientY,pointer:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);},
  onPointerUp:(e:PointerEvent<HTMLElement>)=>{const start=origin.current;origin.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(start&&start.pointer===e.pointerId&&e.clientY-start.y>72&&Math.abs(e.clientX-start.x)<40&&!refreshing){setRefreshing(true);window.location.reload();}},
  onPointerCancel:()=>{origin.current=null;}
 }};
}
