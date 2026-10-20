import { engineId as resolveEngineId, isEngineId } from '../helpers/chessEngines';
import { useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type MouseEvent } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { chessVariants } from '../helpers/chessVariants';
import { cloudTree } from '../helpers/cloudTree';
import { colorValue } from '../helpers/cloudColors';
import { cloudLayout,type CloudLayout } from '../helpers/cloudLayout';
import { identifierFootprint } from '../helpers/cloudIdentifiers';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { redirectURL,linkedLabelParts } from '../helpers/cloudLinks';
import { cloudURL } from '../helpers/cloudRoutes';
import { useCloudHold } from '../helpers/useCloudHold';
import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
import { SpatialViewport } from './SpatialViewport';
import { CloudPhoto } from './CloudPhoto';
import { Button } from './Button';
import styles from './CloudCanvas.module.css';
const layoutCache=new Map<string,{key:string;viewportWidth:number;generation:number;layout:CloudLayout}>();
type Props={identity?:string;nodes:CloudNode[];scope?:CloudScope;parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void;canEdit?:boolean;showIdentifiers?:boolean;onHighlight?:(node:CloudNode)=>void;onCommand?:(node:CloudNode)=>void;className?:string;onAction?:(node:CloudNode,action:'rename'|'remove'|'move'|'copy')=>void};
export function CloudCanvas({nodes,parentId,onOpen,opening,loading,addedId,onPictureError,onHighlight,onCommand,showIdentifiers=false,scope='chess',identity='guest',className=''}:Props){
 const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0),location=useLocation(),hold=useCloudHold(onHighlight);
 useLayoutEffect(()=>{const el=area.current;if(!el)return;const measure=()=>setSize(old=>({width:Math.max(240,el.clientWidth),height:el.closest('[data-keyboard="true"]')?old.height:Math.max(160,el.clientHeight)}));measure();const observer=new ResizeObserver(measure);observer.observe(el);let alive=true;void document.fonts.ready.then(()=>{if(alive)setFontReady(1);});return()=>{alive=false;observer.disconnect();};},[]);
 const siblings=useMemo(()=>cloudTree.sizes(nodes,parentId).map(n=>n.note?{...n,isImage:false,imageUrl:undefined,imageUrls:undefined}:n),[nodes,parentId]);
 const boardGrid=false,square=scope==='chess'&&(parentId==='boards'||parentId==='rules'||!!parentId?.endsWith('-rules')),lastLayout=useRef<{key:string;viewportWidth:number;generation:number;layout:CloudLayout}|null>(null),layoutKey=identity+':'+scope+':'+(parentId||'root')+':organic-v6';
 const layout=useMemo(()=>{
  const context=document.createElement('canvas').getContext('2d');
  const saved=lastLayout.current?.key===layoutKey?lastLayout.current:layoutCache.get(layoutKey),old=saved?.viewportWidth===size.width?saved.layout:undefined;
  const removed=old?.items.some(item=>!siblings.some(n=>n.id===item.id)),previous=removed?undefined:old;
  const width=Math.max(previous?.width||0,size.width,Math.min(2600,Math.sqrt(siblings.length)*140));
  const packed=cloudLayout(siblings.map(n=>({...n,identifier:showIdentifiers?n.identifier:undefined,name:n.name})),width,size.height,(text,font)=>{if(!context)return text.length*font*.54;context.font='500 '+font+'px Inter, sans-serif';return context.measureText(text).width;},{organic:true,square:true,boardGrid,columns:parentId==='boards'||parentId==='rules'||siblings.length<=6?2:Math.max(2,Math.ceil(Math.sqrt(siblings.length)*.8)),compact:size.width<600,previous});
  return {...packed,generation:(saved?.generation||0)+(removed?1:0)};
 },[siblings,size,fontReady,scope,square,boardGrid,layoutKey,showIdentifiers,parentId]);
 useLayoutEffect(()=>{if(!fontReady||loading)return;lastLayout.current={key:layoutKey,viewportWidth:size.width,generation:layout.generation,layout};layoutCache.set(layoutKey,lastLayout.current);},[layout,size.width,fontReady,loading,layoutKey]);
 const rectangles=new Map(layout.items.map(n=>[n.id,n]));
 function destination(node:CloudNode){
  if(node.redirect)return redirectURL(node.redirect);
  if(node.href?.startsWith('/')&&!node.href.startsWith('//'))return node.href;
  if(node.destination==='saved-game'&&node.savedGameId&&node.variant)return '/'+node.variant+'?mode=saved&game='+node.savedGameId+(node.shareId?'&shareId='+node.shareId:'')+'&back='+encodeURIComponent(location.pathname+location.search);
  if(node.destination==='space'&&node.space)return cloudURL(node.space==='chess'?'hexagonal-chess':node.space==='home'?'ion':node.space,node.space);
  if(node.destination==='accounts'||node.id==='accounts')return cloudURL('accounts','accounts');
  if(node.id==='hexagonal-chess')return cloudURL('hexagonal-chess','chess');
  if(node.id==='public'||node.id==='private')return cloudURL(node.id,node.id);
  const query=new URLSearchParams(location.search),back=query.get('return'),context=back?'&return='+encodeURIComponent(back)+'&mode='+(query.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(query.get('level')??'3')+'&engine='+(resolveEngineId(query.get('engine')))+'&saved='+encodeURIComponent(query.get('saved')||''):'';
  if(node.destination==='level'){const level=node.level??3,engine=node.engineId??'tactical';return chessVariants.isId(back)?'/'+back+'?mode=engine&engine='+engine+'&level='+level:'/?cloud=boards&engine='+engine+'&level='+level;}
  if(chessVariants.isId(node.destination)){let mode='friend',level='3',engine='tactical';try{const chosen=localStorage.getItem('ion.engine');if(isEngineId(chosen)){mode='engine';engine=chosen;level=localStorage.getItem('ion.difficulty')||'3';}}catch{}if(query.has('engine')){mode='engine';engine=resolveEngineId(query.get('engine'));level=query.get('level')||'3';}return '/'+node.destination+'?mode='+mode+(mode==='engine'?'&engine='+engine+'&level='+level:'');}
  return cloudURL(node.id,scope)+context;
 }
 return <div ref={area} className={styles.viewport+' '+className}><SpatialViewport width={layout.width} height={layout.height} viewKey={layoutKey+':'+layout.generation} ready={!!fontReady&&!loading} refitKey={size.width+':'+size.height} initialZoom={siblings.length<=9?Math.min(1,size.width/layout.width,size.height/layout.height):Math.max(.65,Math.min(1,size.width/layout.width))}>
 <div className={styles.canvas+(opening?' '+styles.leaving:'')} data-home={scope==='home'&&parentId==='ion'} role="group" aria-label={parentId?'Droplets':'Clouds'} aria-busy={loading} style={{width:layout.width,height:layout.height,visibility:fontReady&&!loading?'visible':'hidden'}}>
 {siblings.map(node=>{const rect=rectangles.get(node.id);if(!rect)return null;const picture=node.isImage||cloudPhotoUrls(node).length>0,identifier=showIdentifiers?node.identifier:undefined;
  const label=identifier?<span className={styles.identifier} data-identifier={identifier} style={{width:identifierFootprint(identifier).width-6}}>{identifier}</span>:null;
  const content=picture?<><CloudPhoto node={node} size={rect.pictureSize??rect.width-24} onError={onPictureError}/><span className={styles.caption}><span className={styles.text}>{node.name}</span>{label}</span></>:<><span className={styles.text}>{node.name}</span>{label}</>;
  const props={...hold.handlers(node),className:[styles.node,picture?styles.picture:'',opening&&opening!==node.id?styles.fading:'',node.id===addedId?styles.justAdded:''].join(' '),'data-node-id':node.id,'data-percent':node.percent,'data-descendants':node.count,'data-holding':hold.holding===node.id,'aria-label':node.name,'aria-description':(identifier?identifier+'. ':'')+(node.destination?'Open '+node.name:node.count+' droplets inside. Hold for Controls.'),style:{color:colorValue(node.color||cloudTree.seed.find(n=>n.id===node.id)?.color),'--node-x':rect.x+'px','--node-y':rect.y+'px',width:rect.width,minHeight:rect.height,fontSize:rect.fontSize,'--caption-size':(rect.captionSize??16)+'px'} as CSSProperties};
  if(node.wordRedirect){
   const own=destination({...node,wordRedirect:undefined});
   const words=<span className={styles.linkedLabel}>{linkedLabelParts(node).map((part,i)=>{if(!part.word)return <span key={i}>{part.text}</span>;const target=part.linked?redirectURL(node.wordRedirect!.target):own;return /^https?:/.test(target)?<a key={i} className={part.linked?styles.linkedWord:undefined} href={target} target="_blank" rel="noopener noreferrer">{part.text}</a>:<Link key={i} className={part.linked?styles.linkedWord:undefined} to={target} onClick={e=>onOpen(e,node.id,target)}>{part.text}</Link>;})}</span>;
   return <span key={node.id} {...props} role="group">{picture&&<Link to={own} onClick={e=>onOpen(e,node.id,own)}><CloudPhoto node={node} size={rect.pictureSize??rect.width-24}/></Link>}{picture?<span className={styles.caption}>{words}{label}</span>:<>{words}{label}</>}</span>;
  }
  const target=destination(node);if(/^https?:/.test(target))return <a key={node.id} {...props} href={target} target="_blank" rel="noopener noreferrer">{content}</a>;
  return node.destination==='control'||node.destination==='account'?<Button key={node.id} variant="ghost" {...props} onClick={()=>onCommand?.(node)}>{content}</Button>:<Link key={node.id} {...props} to={destination(node)} onClick={e=>{if(node.destination==='level')try{localStorage.setItem('ion.engine',node.engineId??'tactical');localStorage.setItem('ion.difficulty',String(node.level??3));}catch{}onOpen(e,node.id,destination(node));}}>{content}</Link>;
 })}
 {!siblings.length&&!loading&&<p className={styles.empty}>{scope==='private'?'Add a word or picture.':'Nothing here yet.'}</p>}
 </div></SpatialViewport></div>;
}
