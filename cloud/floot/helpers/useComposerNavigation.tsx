import {useRef,type PointerEvent} from 'react';
import {requestPageAction} from './pageWorkspaceEvents';
export function composerSwipe(dx:number,dy:number){if(Math.abs(dx)>=64&&Math.abs(dx)>Math.abs(dy)*1.5)return dx>0?'previous' as const:'new' as const;if(dy<=-56&&Math.abs(dy)>Math.abs(dx)*1.5)return 'tiles' as const;return null;}
export function useComposerNavigation(){
 const start=useRef<{x:number;y:number;id:number;target:HTMLElement;claimed:boolean}|null>(null),suppress=useRef(false);
 return{
  'data-ion-composer-navigation':'',
  onPointerDownCapture:(e:PointerEvent<HTMLElement>)=>{const target=e.target as HTMLElement;if(e.button!==0||!e.isPrimary||target.closest('button,[role="slider"],input[type="file"]'))return;suppress.current=false;start.current={x:e.clientX,y:e.clientY,id:e.pointerId,target,claimed:false};target.setPointerCapture?.(e.pointerId);},
  onPointerMoveCapture:(e:PointerEvent<HTMLElement>)=>{const p=start.current;if(!p||p.id!==e.pointerId)return;const action=composerSwipe(e.clientX-p.x,e.clientY-p.y);if(!action)return;p.claimed=true;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);},
  onPointerUpCapture:(e:PointerEvent<HTMLElement>)=>{const p=start.current;start.current=null;if(p?.target.hasPointerCapture?.(e.pointerId))p.target.releasePointerCapture(e.pointerId);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(!p||!p.claimed)return;const action=composerSwipe(e.clientX-p.x,e.clientY-p.y);if(!action)return;suppress.current=true;e.preventDefault();e.stopPropagation();requestPageAction(action==='tiles'?{action:'tiles'}:action==='new'?{action:'new-tile'}:{action:'tile-step',step:-1});},
  onPointerCancel:()=>{start.current=null;},
  onClickCapture:(e:{preventDefault:()=>void;stopPropagation:()=>void})=>{if(suppress.current){suppress.current=false;e.preventDefault();e.stopPropagation();}}
 };
}
