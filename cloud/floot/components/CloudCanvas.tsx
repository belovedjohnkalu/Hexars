import { useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type MouseEvent } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { chessVariants } from '../helpers/chessVariants';
import { cloudTree } from '../helpers/cloudTree';
import { colorValue } from '../helpers/cloudColors';
import { cloudHomeLayout } from '../helpers/cloudHomeLayout';
import { cloudLayout,type CloudLayout } from '../helpers/cloudLayout';
import { identifierFootprint } from '../helpers/cloudIdentifiers';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { cloudURL } from '../helpers/cloudRoutes';
import { useCloudHold } from '../helpers/useCloudHold';
import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
import { SpatialViewport } from './SpatialViewport';
import { CloudPhoto } from './CloudPhoto';
import { Button } from './Button';
import styles from './CloudCanvas.module.css';
const layoutCache=new Map<string,{key:string;viewportWidth:number;layout:CloudLayout}>();
type Props={identity?:string;nodes:CloudNode[];scope?:CloudScope;parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void;canEdit?:boolean;showIdentifiers?:boolean;onHighlight?:(node:CloudNode)=>void;onCommand?:(node:CloudNode)=>void;className?:string;onAction?:(node:CloudNode,action:'rename'|'remove'|'move'|'copy')=>void};
export function CloudCanvas({nodes,parentId,onOpen,opening,loading,addedId,onPictureError,onHighlight,onCommand,showIdentifiers=false,scope='chess',identity='guest',className=''}:Props){
 const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0),location=useLocation(),hold=useCloudHold(onHighlight);
 useLayoutEffect(()=>{const el=area.current;if(!el)return;const measure=()=>setSize(old=>({width:Math.max(240,el.clientWidth),height:el.closest('[data-keyboard="true"]')?old.height:Math.max(160,el.clientHeight)}));measure();const observer=new ResizeObserver(measure);observer.observe(el);let alive=true;void document.fonts.ready.then(()=>{if(alive)setFontReady(1);});return()=>{alive=false;observer.disconnect();};},[]);
 const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId).map(n=>n.note?{...n,isImage:false,imageUrl:undefined,imageUrls:undefined}:n),[nodes,parentId]);
 const boardGrid=scope==='chess'&&parentId==='boards',square=scope==='chess'&&(parentId==='boards'||parentId==='rules'||!!parentId?.endsWith('-rules')),lastLayout=useRef<{key:string;viewportWidth:number;layout:CloudLayout}|null>(null),layoutKey=identity+':'+scope+':'+(parentId||'root')+(boardGrid?':grid-v2':'');
 const layout=useMemo(()=>{
  const context=document.createElement('canvas').getContext('2d');
  const saved=lastLayout.current?.key===layoutKey?lastLayout.current:layoutCache.get(layoutKey),old=saved?.viewportWidth===size.width?saved.layout:undefined;
  const previous=old||(scope==='home'&&parentId==='ion'?cloudHomeLayout(size.width,size.height):undefined);
  const width=Math.max(previous?.width||0,size.width,boardGrid?0:square?Math.max(760,Math.ceil(Math.sqrt(siblings.length))*165):Math.min(2400,Math.sqrt(siblings.length)*100));
  return cloudLayout(siblings.map(n=>({...n,identifier:showIdentifiers?n.identifier:undefined,name:n.name})),width,size.height,(text,font)=>{if(!context)return text.length*font*.54;context.font='500 '+font+'px Inter, sans-serif';return context.measureText(text).width;},{square,boardGrid,compact:size.width<600,previous});
 },[siblings,size,fontReady,scope,square,boardGrid,layoutKey,showIdentifiers,parentId]);
 useLayoutEffect(()=>{if(!fontReady||loading)return;const old=lastLayout.current?.key===layoutKey?lastLayout.current:layoutCache.get(layoutKey),retain=old?.key===layoutKey&&old.viewportWidth===size.width&&old.layout.width===layout.width;const items=retain?[...new Map([...old.layout.items,...layout.items].map(n=>[n.id,n])).values()]:layout.items;lastLayout.current={key:layoutKey,viewportWidth:size.width,layout:{...layout,items}};layoutCache.set(layoutKey,lastLayout.current);},[layout,size.width,fontReady,loading,layoutKey]);
 const rectangles=new Map(layout.items.map(n=>[n.id,n]));
 function destination(node:CloudNode){
  if(node.destination==='space'&&node.space)return cloudURL(node.space==='chess'?'hexagonal-chess':node.space==='home'?'ion':node.space,node.space);
  if(node.destination==='accounts'||node.id==='accounts')return cloudURL('accounts','accounts');
  if(node.id==='hexagonal-chess')return cloudURL('hexagonal-chess','chess');
  if(node.id==='public'||node.id==='private')return cloudURL(node.id,node.id);
  const query=new URLSearchParams(location.search),back=query.get('return'),context=back?'&return='+encodeURIComponent(back)+'&mode='+(query.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(query.get('level')??'3'):'';
  if(node.destination==='level'){const level=node.level??3;return chessVariants.isId(back)?'/'+back+'?mode=engine&level='+level:'/?cloud=boards&level='+level;}
  if(chessVariants.isId(node.destination)){let mode='friend',level='3';try{if(localStorage.getItem('ion.engine')==='tactical'){mode='engine';level=localStorage.getItem('ion.difficulty')||'3';}}catch{}return '/'+node.destination+'?mode='+mode+(mode==='engine'?'&level='+level:'');}
  return cloudURL(node.id,scope)+context;
 }
 return <div ref={area} className={styles.viewport+' '+className}><SpatialViewport width={layout.width} height={layout.height} viewKey={layoutKey} ready={!!fontReady&&!loading} refitKey={size.width+':'+size.height} initialZoom={boardGrid?Math.min(1,size.width/layout.width,size.height/layout.height):square?1:layout.width>size.width?Math.max(.7,Math.min(1,size.width/layout.width,size.height/layout.height)):undefined}>
 <div className={styles.canvas+(opening?' '+styles.leaving:'')} data-home={scope==='home'&&parentId==='ion'} role="group" aria-label={parentId?'Droplets':'Clouds'} aria-busy={loading} style={{width:layout.width,height:layout.height,visibility:fontReady&&!loading?'visible':'hidden'}}>
 {siblings.map(node=>{const rect=rectangles.get(node.id);if(!rect)return null;const picture=node.isImage||cloudPhotoUrls(node).length>0,identifier=showIdentifiers?node.identifier:undefined;
  const label=identifier?<span className={styles.identifier} data-identifier={identifier} style={{width:identifierFootprint(identifier).width-6}}>{identifier}</span>:null;
  const content=picture?<><CloudPhoto node={node} size={rect.pictureSize??rect.width-24} onError={onPictureError}/><span className={styles.caption}><span className={styles.text}>{node.name}</span>{label}</span></>:<><span className={styles.text}>{node.name}</span>{label}</>;
  const props={...hold.handlers(node),className:[styles.node,picture?styles.picture:'',opening&&opening!==node.id?styles.fading:'',node.id===addedId?styles.justAdded:''].join(' '),'data-node-id':node.id,'data-percent':node.percent,'data-descendants':node.count,'data-holding':hold.holding===node.id,'aria-label':node.name,'aria-description':(identifier?identifier+'. ':'')+(node.destination?'Open '+node.name:node.count+' droplets inside. Hold for Controls.'),style:{color:colorValue(node.color||cloudTree.seed.find(n=>n.id===node.id)?.color),'--node-x':rect.x+'px','--node-y':rect.y+'px',width:rect.width,minHeight:rect.height,fontSize:rect.fontSize} as CSSProperties};
  return node.destination==='control'||node.destination==='account'?<Button key={node.id} variant="ghost" {...props} onClick={()=>onCommand?.(node)}>{content}</Button>:<Link key={node.id} {...props} to={destination(node)} onClick={e=>{if(node.destination==='level')try{localStorage.setItem('ion.engine','tactical');localStorage.setItem('ion.difficulty',String(node.level??3));}catch{}onOpen(e,node.id,destination(node));}}>{content}</Link>;
 })}
 {!siblings.length&&!loading&&<p className={styles.empty}>{scope==='private'?'Add a word or picture.':'Nothing here yet.'}</p>}
 </div></SpatialViewport></div>;
}
