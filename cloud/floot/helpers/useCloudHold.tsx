import { useEffect,useRef,useState } from 'react';
import type { PointerEvent,MouseEvent,KeyboardEvent } from 'react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export const CLOUD_HOLD_MS=180;
let heldPointer=false,blockedUntil=0;
export function useCloudHold(onHighlight?:(node:CloudNode)=>void){
 const current=useRef<{id:number;x:number;y:number;node:CloudNode}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),[holding,setHolding]=useState<string|null>(null);
 const cancel=()=>{clearTimeout(timer.current);current.current=null;setHolding(null);};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return {holding,handlers:(node:CloudNode)=>({
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{if(e.button!==0)return;e.preventDefault();cancel();if(!onHighlight)return;current.current={id:e.pointerId,x:e.clientX,y:e.clientY,node};timer.current=setTimeout(()=>{if(!current.current)return;setHolding(node.id);heldPointer=true;onHighlight(node);},CLOUD_HOLD_MS);},
  onPointerMove:(e:PointerEvent<HTMLElement>)=>{const start=current.current;if(start&&(e.pointerId!==start.id||Math.hypot(e.clientX-start.x,e.clientY-start.y)>8))cancel();},
  onPointerUp:cancel,onPointerCancel:cancel,
  onContextMenu:(e:MouseEvent<HTMLElement>)=>{e.preventDefault();cancel();onHighlight?.(node);},
  onKeyDown:(e:KeyboardEvent<HTMLElement>)=>{if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();cancel();onHighlight?.(node);}}
 })};
}

export function useCloudHoldGuard(){
 useEffect(()=>{const begin=()=>{if(!heldPointer)blockedUntil=0;};const release=()=>{if(heldPointer){heldPointer=false;blockedUntil=Date.now()+100;}};const click=(e:globalThis.MouseEvent)=>{if(heldPointer||Date.now()<blockedUntil){e.preventDefault();e.stopImmediatePropagation();}};document.addEventListener('pointerdown',begin,true);document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);document.addEventListener('click',click,true);return()=>{document.removeEventListener('pointerdown',begin,true);document.removeEventListener('pointerup',release,true);document.removeEventListener('pointercancel',release,true);document.removeEventListener('click',click,true);};},[]);
}
