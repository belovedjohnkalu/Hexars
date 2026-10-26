import {useEffect,useRef,useState,type PointerEvent,type KeyboardEvent,type MouseEvent} from 'react';
import {CLOUD_HOLD_MS} from './useCloudHold';
import {requestPageAction} from './pageWorkspaceEvents';
export function titleSwipe(dx:number,dy:number){if(Math.max(Math.abs(dx),Math.abs(dy))<52)return null;if(Math.abs(dx)>Math.abs(dy)*1.35)return dx<0?'right' as const:'left' as const;if(Math.abs(dy)>Math.abs(dx)*1.35)return dy>0?'up' as const:'down' as const;return null;}
export function useTitleRefresh(onHold?:()=>void,onOpen?:()=>void){
 const origin=useRef<{x:number;y:number;sx:number;sy:number;pointer:number;at:number;held?:boolean;moved?:boolean;dragged?:boolean}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),lastRefresh=useRef(-Infinity),suppress=useRef(false),callback=useRef({onHold,onOpen}),[refreshing,setRefreshing]=useState(false);callback.current={onHold,onOpen};
 const showContent=()=>{if(callback.current.onOpen)callback.current.onOpen();else window.dispatchEvent(new window.CustomEvent('ion.title-content',{detail:{id:'title',parentId:null,name:document.querySelector('[data-ion-title]')?.textContent||document.title}}));};
 const cancel=()=>clearTimeout(timer.current),menu=()=>{window.dispatchEvent(new window.CustomEvent('ion.title-menu',{detail:{onHold:callback.current.onHold,onOpen:showContent}}));};
 useEffect(()=>cancel,[]);
 useEffect(()=>{if(!refreshing)return;const t=setTimeout(()=>setRefreshing(false),1500);return()=>clearTimeout(t);},[refreshing]);
 const refresh=()=>{const now=performance.now();if(now-lastRefresh.current<350)return;lastRefresh.current=now;setRefreshing(true);requestPageAction({action:'refresh'});};
 const drag=(phase:'move'|'end'|'cancel',p:NonNullable<typeof origin.current>,e:PointerEvent<HTMLElement>)=>requestPageAction({action:'drag',phase,dx:e.screenX-p.sx,dy:e.screenY-p.sy,startX:p.x,startY:p.y});
 return{refreshing,handlers:{
  'data-ion-title':'',
  'aria-description':'Refresh page. Hold for screen options.',
  'aria-busy':refreshing,
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{cancel();if(!e.isPrimary||e.button!==0){origin.current=null;return;}e.preventDefault();suppress.current=false;origin.current={x:e.clientX,y:e.clientY,sx:e.screenX,sy:e.screenY,pointer:e.pointerId,at:performance.now()};e.currentTarget.setPointerCapture(e.pointerId);timer.current=setTimeout(()=>{if(origin.current&&!origin.current.moved){origin.current.held=true;suppress.current=true;menu();}},CLOUD_HOLD_MS);},
  onPointerMove:(e:PointerEvent<HTMLElement>)=>{const p=origin.current;if(!p||p.pointer!==e.pointerId||p.held)return;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>8){p.moved=true;cancel();}if(p.moved&&performance.now()-p.at>=320){p.dragged=true;drag('move',p,e);}},
  onPointerUp:(e:PointerEvent<HTMLElement>)=>{cancel();const p=origin.current;origin.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(!p||p.pointer!==e.pointerId)return;if(p.held){suppress.current=true;return;}if(p.dragged||p.moved&&performance.now()-p.at>=320){suppress.current=true;drag('end',p,e);return;}const direction=titleSwipe(e.clientX-p.x,e.clientY-p.y);if(direction){suppress.current=true;requestPageAction({action:'split',direction});return;}if(p.moved)suppress.current=true;},
  onPointerCancel:(e:PointerEvent<HTMLElement>)=>{cancel();if(origin.current?.dragged)drag('cancel',origin.current,e);origin.current=null;suppress.current=true;},
  onClick:(e:MouseEvent<HTMLElement>)=>{e.preventDefault();if(suppress.current){suppress.current=false;return;}refresh();},
  onContextMenu:(e:MouseEvent<HTMLElement>)=>{e.preventDefault();cancel();menu();},
  onKeyDown:(e:KeyboardEvent<HTMLElement>)=>{if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();menu();}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();refresh();}}
 }};
}
