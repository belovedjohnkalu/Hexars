import { useEffect,useRef,useState,type MouseEvent } from 'react';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { canViewCloudPhoto } from './cloudPhotos';
export const PICTURE_DOUBLE_TAP_MS=300;
export function usePictureTap(onEdit?:(node:CloudNode)=>void){
 const [viewing,setViewing]=useState<CloudNode|null>(null),pending=useRef<{id:string;timer:ReturnType<typeof setTimeout>}|null>(null);
 const cancel=()=>{if(pending.current)clearTimeout(pending.current.timer);pending.current=null;};
 useEffect(()=>cancel,[]);
 function click(event:MouseEvent<HTMLElement>,node:CloudNode,single:()=>void){
  const picture=event.target instanceof Element&&!!event.target.closest('[data-photo-count]'),editable=!!onEdit&&!!node.canEdit&&!picture;
  if(node.lockedItem||!editable&&(!picture||!canViewCloudPhoto(node))||event.detail===0||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return false;
  event.preventDefault();event.stopPropagation();
  if(pending.current?.id===node.id){cancel();if(editable)onEdit!(node);else setViewing(node);return true;}
  cancel();pending.current={id:node.id,timer:setTimeout(()=>{pending.current=null;single();},PICTURE_DOUBLE_TAP_MS)};return true;
 }
 return {viewing,close:()=>setViewing(null),show:(node:CloudNode)=>{cancel();setViewing(node);},click};
}
