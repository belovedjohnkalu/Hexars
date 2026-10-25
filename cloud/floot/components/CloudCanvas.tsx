import {checkersRoot} from '../helpers/checkersClouds';
import { chessNavigationNodes,chessNavigationAnchors } from '../helpers/chessNavigation';
import { useRandomWordColor,randomColorCloudId } from '../helpers/useRandomWordColor';
import { notificationsId } from '../helpers/notificationRoutes';
import { useNotifications } from '../helpers/useNotifications';
import { useAppearance,inversionCloudId } from '../helpers/useAppearance';
import { usePictureTap } from '../helpers/usePictureTap';
import { CloudPhotoViewer } from './CloudPhotoViewer';
import { scheduleCalendar } from '../helpers/scheduleCalendar';
import { engineId as resolveEngineId } from '../helpers/chessEngines';
import { useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type MouseEvent } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { chessVariants } from '../helpers/chessVariants';
import { cloudTree } from '../helpers/cloudTree';
import { colorValue } from '../helpers/cloudColors';
import { cloudLayout,type CloudLayout } from '../helpers/cloudLayout';
import { identifierFootprint } from '../helpers/cloudIdentifiers';
import { cloudPhotoUrls,canViewCloudPhoto } from '../helpers/cloudPhotos';
import { redirectURL,linkedLabelParts } from '../helpers/cloudLinks';
import { cloudURL } from '../helpers/cloudRoutes';
import { useCloudHold } from '../helpers/useCloudHold';
import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
import { SpatialViewport } from './SpatialViewport';
import { CloudPhoto } from './CloudPhoto';
import { Button } from './Button';
import styles from './CloudCanvas.module.css';
const layoutCache=new Map<string,{key:string;viewportWidth:number;generation:number;layout:CloudLayout}>();
type Props={tabularNumbers?:boolean;fitOnChange?:boolean;identity?:string;nodes:CloudNode[];scope?:CloudScope;parentId:string|null;onOpen:(event:MouseEvent<HTMLAnchorElement>,id:string,destination:string)=>void;opening:string|null;loading:boolean;addedId?:string|null;onPictureError?:()=>void;canEdit?:boolean;showIdentifiers?:boolean;onHighlight?:(node:CloudNode)=>void;onCommand?:(node:CloudNode)=>void;className?:string;onAction?:(node:CloudNode,action:'rename'|'remove'|'move'|'copy')=>void};
export function CloudCanvas({tabularNumbers=false,fitOnChange=false,nodes,parentId,onOpen,opening,loading,addedId,onPictureError,onHighlight,onCommand,showIdentifiers=false,scope='chess',identity='guest',className=''}:Props){
 const photos=usePictureTap(),appearance=useAppearance(),notifications=useNotifications(),randomColors=useRandomWordColor();
 const [coarsePointer,setCoarsePointer]=useState(()=>typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches);
 useLayoutEffect(()=>{if(typeof matchMedia!=='function')return;const query=matchMedia('(pointer: coarse)'),update=()=>setCoarsePointer(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const area=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:360,height:480}),[fontReady,setFontReady]=useState(0),location=useLocation(),hold=useCloudHold(onHighlight);
 useLayoutEffect(()=>{const el=area.current;if(!el)return;const measure=()=>setSize(old=>({width:Math.max(240,el.clientWidth),height:el.closest('[data-keyboard="true"]')?old.height:Math.max(160,el.clientHeight)}));measure();const observer=new ResizeObserver(measure);observer.observe(el);let alive=true;void document.fonts.ready.then(()=>{if(alive)setFontReady(1);});return()=>{alive=false;observer.disconnect();};},[]);
 const returnVariant=new URLSearchParams(location.search).get('return');
 const siblings=useMemo(()=>cloudTree.sizes(chessNavigationNodes(nodes,scope,returnVariant),parentId).map(n=>n.note?{...n,isImage:false,imageUrl:undefined,imageUrls:undefined}:n),[nodes,parentId,scope,returnVariant]);
 const boardGrid=false,square=scope==='chess'&&(parentId==='boards'||parentId==='rules'||!!parentId?.endsWith('-rules')),lastLayout=useRef<{key:string;viewportWidth:number;generation:number;layout:CloudLayout}|null>(null),layoutKey=identity+':'+scope+':'+(parentId||'root')+(scope==='chess'?':organic-v13':':organic-v11')+(coarsePointer?':touch':'');
 const layout=useMemo(()=>{
  const context=document.createElement('canvas').getContext('2d');
  const saved=lastLayout.current?.key===layoutKey?lastLayout.current:layoutCache.get(layoutKey),old=saved?.viewportWidth===size.width?saved.layout:undefined;
  const removed=old?.items.some(item=>!siblings.some(n=>n.id===item.id)),previous=removed?undefined:old;
  const width=Math.max(previous?.width||0,size.width,Math.min(2600,Math.sqrt(siblings.length)*140));
  const packed=cloudLayout(siblings.map(n=>({...n,identifier:showIdentifiers?n.identifier:undefined,name:n.name})),width,size.height,(text,font)=>{if(!context)return text.length*font*.54;context.font='500 '+font+'px Inter, sans-serif';return context.measureText(tabularNumbers?text.replace(/\d/g,'0'):text).width;},{anchors:scope==='chess'&&parentId==='hexagonal-chess'?chessNavigationAnchors:undefined,organic:true,square:true,boardGrid,columns:parentId==='boards'||parentId==='rules'||siblings.length<=6?2:Math.max(2,Math.ceil(Math.sqrt(siblings.length)*.8)),compact:size.width<600,minTargetSize:coarsePointer?72:undefined,maxFontSize:Math.min(100,Math.min(size.width,size.height)*.18),labelMaxWidth:Math.max(180,Math.min(560,size.width*.78)),previous});
  return {...packed,generation:(saved?.generation||0)+(removed?1:0)};
 },[siblings,size,fontReady,scope,square,boardGrid,layoutKey,showIdentifiers,parentId,tabularNumbers,coarsePointer]);
 useLayoutEffect(()=>{if(!fontReady||loading)return;lastLayout.current={key:layoutKey,viewportWidth:size.width,generation:layout.generation,layout};layoutCache.delete(layoutKey);layoutCache.set(layoutKey,lastLayout.current);if(layoutCache.size>128)layoutCache.delete(layoutCache.keys().next().value!);},[layout,size.width,fontReady,loading,layoutKey]);
 const bounds=layout.items.length?{x:Math.min(...layout.items.map(n=>n.x)),y:Math.min(...layout.items.map(n=>n.y)),width:0,height:0}:undefined;
 if(bounds){bounds.width=Math.max(...layout.items.map(n=>n.x+n.width))-bounds.x;bounds.height=Math.max(...layout.items.map(n=>n.y+n.height))-bounds.y;}
 const rectangles=new Map(layout.items.map(n=>[n.id,n]));
 function destination(node:CloudNode){
  if(scope==='home'&&(node.id===scheduleCalendar.root||node.calendarDate))return cloudURL(node.id,'schedule');
  if(node.lockedItem)return '/?'+new URLSearchParams({cloud:'time-product',space:'home',item:node.lockedItem,back:location.pathname+location.search});
  if(node.redirect)return redirectURL(node.redirect);
  if(node.href?.startsWith('/')&&!node.href.startsWith('//'))return node.href;
  if(node.destination==='saved-game'&&node.savedGameId&&node.variant)return '/'+node.variant+'?mode=saved&game='+node.savedGameId+(node.shareId?'&shareId='+node.shareId:'')+'&back='+encodeURIComponent(location.pathname+location.search);
  if(node.destination==='space'&&node.space)return cloudURL(node.space==='chess'?'hexagonal-chess':node.space==='home'?'ion':node.space,node.space);
  if(node.destination==='accounts'||node.id==='accounts')return cloudURL('accounts','accounts');
  if(node.id==='hexagonal-chess')return cloudURL('hexagonal-chess','chess');
  if(node.id==='public'||node.id==='private')return cloudURL(node.id,node.id);
  const query=new URLSearchParams(location.search),back=query.get('return'),context=back?'&return='+encodeURIComponent(back)+'&mode='+(query.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(query.get('level')??'3')+'&engine='+(resolveEngineId(query.get('engine')))+'&saved='+encodeURIComponent(query.get('saved')||''):'';
  if(node.id==='checkers-computer'&&!chessVariants.isCheckers(back))return cloudURL(checkersRoot,'chess');
  if((node.id==='engines'||node.destination==='level')&&!chessVariants.isId(back))return cloudURL('boards','chess');
  if(node.destination==='level'){const level=node.level??3,engine='universal';return chessVariants.isId(back)?'/'+back+'?mode=engine&engine='+engine+'&level='+level:'/?cloud=boards&engine='+engine+'&level='+level;}
  if(chessVariants.isId(node.destination))return '/'+node.destination+'?mode=friend';
  return cloudURL(node.id,scope)+context;
 }
 return <div ref={area} className={styles.viewport+' '+(tabularNumbers?styles.tabular+' ':'')+className}><SpatialViewport minFitZoom={coarsePointer?0.65:undefined} maxFitZoom={1} fitPadding={28} width={layout.width} height={layout.height} viewKey={layoutKey+':'+layout.generation} ready={!!fontReady&&!loading} refitKey={size.width+':'+size.height+(fitOnChange?':'+siblings.map(n=>tabularNumbers?n.name.replace(/\d/g,'0'):n.name).join('|'):'')} contentBounds={bounds}>
 <div className={styles.canvas+(opening?' '+styles.leaving:'')} data-home={scope==='home'&&parentId==='ion'} role="group" aria-label={scope==='home'&&(parentId==='ion'||parentId==='home-hidden-features')?'Features':parentId?'Droplets':'Clouds'} aria-busy={loading} style={{width:layout.width,height:layout.height,visibility:fontReady&&!loading?'visible':'hidden'}}>
 {siblings.map(node=>{const rect=rectangles.get(node.id);if(!rect)return null;const picture=node.isImage||cloudPhotoUrls(node).length>0,identifier=showIdentifiers?node.identifier:undefined;
  const label=identifier?<span className={styles.identifier} data-identifier={identifier} style={{width:identifierFootprint(identifier).width-6}}>{identifier}</span>:null;
  const delivery=node.publishing?<span className={styles.delivery} role="status" aria-label={node.publishing==='failed'?'Failed to publish':'Sending'}>{node.publishing==='failed'?'!':'↥'}</span>:null;
  const content=picture?<><CloudPhoto node={node} size={rect.pictureSize??rect.width-24} onError={onPictureError}/><span className={styles.caption}><span className={styles.text}>{(rect.lines??[node.name]).join('\n')}</span>{label}{delivery}</span></>:<><span className={styles.text}>{(rect.lines??[node.name]).join('\n')}</span>{label}{delivery}</>;
  const props={...hold.handlers(node),className:[styles.node,node.lockedItem?styles.locked:'',picture?styles.picture:'',opening&&opening!==node.id?styles.fading:'',node.id===addedId?styles.justAdded:''].join(' '),'data-node-id':node.id,'aria-keyshortcuts':canViewCloudPhoto(node)&&!node.lockedItem?'Alt+Enter':undefined,'data-inversion-toggle':node.id===inversionCloudId||node.id===randomColorCloudId?true:undefined,'aria-pressed':node.id===randomColorCloudId?randomColors.enabled:node.id===notificationsId?notifications.enabled:node.id===inversionCloudId?appearance.inverted:undefined,'aria-busy':node.id===notificationsId?notifications.busy:undefined,'data-calendar-status':node.calendarStatus,'data-percent':node.percentExact,'data-descendants':node.count,'data-characters':node.characters,'data-holding':hold.holding===node.id,'aria-label':node.name+(node.publishing==='pending'?' · sending':node.publishing==='failed'?' · failed':''),'aria-description':(identifier?identifier+'. ':'')+(node.calendarStatus?node.calendarStatus+' '+(node.calendarDate?.day?'date':node.calendarDate?.month?'month':'year')+'. ':'')+(node.lockedItem?'Purchase required.':node.destination?'Open '+node.name:node.count+' inside. Hold for Controls.'),style:{color:node.id===randomColorCloudId?(randomColors.enabled?'var(--inversion-on)':'var(--inversion-off)'):node.id===notificationsId?(notifications.enabled?'var(--inversion-on)':'var(--inversion-off)'):node.id===inversionCloudId?(appearance.inverted?'var(--inversion-on)':'var(--inversion-off)'):colorValue(node.color||cloudTree.seed.find(n=>n.id===node.id)?.color),'--node-x':rect.x+'px','--node-y':rect.y+'px',width:rect.width,minHeight:rect.height,fontSize:rect.fontSize,'--caption-size':(rect.captionSize??16)+'px'} as CSSProperties};
  const pictureClick=(e:MouseEvent<HTMLAnchorElement>,to:string)=>{return photos.click(e,node,()=>{if(/^https?:/.test(to))window.open(to,'_blank','noopener,noreferrer');else onOpen(e,node.id,to);});};
  const keyDown=props.onKeyDown;props.onKeyDown=e=>{if(e.altKey&&e.key==='Enter'&&!node.lockedItem&&canViewCloudPhoto(node)){e.preventDefault();photos.show(node);}else keyDown(e);};
  if(node.wordRedirect&&!node.lockedItem){
   const own=destination({...node,wordRedirect:undefined});
   const words=<span className={styles.linkedLabel}>{linkedLabelParts({...node,name:(rect.lines??[node.name]).join('\n')}).map((part,i)=>{if(!part.word)return <span key={i}>{part.text}</span>;const target=part.linked?redirectURL(node.wordRedirect!.target):own;return /^https?:/.test(target)?<a key={i} className={part.linked?styles.linkedWord:undefined} href={target} target="_blank" rel="noopener noreferrer">{part.text}</a>:<Link key={i} className={part.linked?styles.linkedWord:undefined} to={target} onClick={e=>onOpen(e,node.id,target)}>{part.text}</Link>;})}</span>;
   return <span key={node.id} {...props} role="group">{picture&&<Link to={own} onClick={e=>{if(!pictureClick(e,own))onOpen(e,node.id,own);}}><CloudPhoto node={node} size={rect.pictureSize??rect.width-24}/></Link>}{picture?<span className={styles.caption}>{words}{label}</span>:<>{words}{label}</>}</span>;
  }
  const target=destination(node);if(/^https?:/.test(target))return <a key={node.id} {...props} href={target} target="_blank" rel="noopener noreferrer" onClick={e=>{pictureClick(e,target);}}>{content}</a>;
  return node.id===randomColorCloudId||node.id===notificationsId||node.id===inversionCloudId||node.destination==='control'||node.destination==='account'?<Button key={node.id} variant="ghost" {...props} onClick={e=>{const command=()=>node.id===randomColorCloudId?randomColors.toggle():node.id===notificationsId?void notifications.toggle():node.id===inversionCloudId?appearance.toggle():onCommand?.(node);if(!photos.click(e,node,command))command();}}>{content}</Button>:<Link key={node.id} {...props} to={destination(node)} onClick={e=>{if(pictureClick(e,target))return;if(node.destination==='level'&&!node.lockedItem)try{localStorage.setItem('ion.engine','universal');localStorage.setItem('ion.difficulty',String(node.level??3));}catch{}onOpen(e,node.id,destination(node));}}>{content}</Link>;
 })}
 {!siblings.length&&!loading&&<p className={styles.empty}>Nothing here yet</p>}
 </div></SpatialViewport>{photos.viewing&&<CloudPhotoViewer node={photos.viewing} onClose={photos.close}/>}</div>;
}
