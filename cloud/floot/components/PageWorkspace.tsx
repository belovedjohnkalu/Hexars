import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {desktopTyping,focusCloudComposer} from '../helpers/cloudTyping';
import {cloudDrafts} from '../helpers/cloudDrafts';
import {isPagePane,pageKey,pageLayout} from '../helpers/pageWorkspace';
import {LoadingScreen} from './LoadingScreen';
import styles from './PageWorkspace.module.css';
type View={id:number;url:string};
export function PageWorkspace({children}:{children:ReactNode}){
 const embedded=isPagePane(),[views,setViews]=useState<View[]>([{id:0,url:''}]),[size,setSize]=useState({width:0,height:0}),[loaded,setLoaded]=useState<number[]>([]),[notice,setNotice]=useState(''),host=useRef<HTMLDivElement>(null),frames=useRef(new Map<number,HTMLIFrameElement>()),active=useRef(0),current=useRef(views),closing=useRef(false);current.current=views;
 useEffect(()=>{if(embedded)return;const el=host.current;if(!el)return;const measure=()=>setSize({width:el.clientWidth,height:el.clientHeight}),observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect();},[embedded]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{
  if(embedded){
   const key=(event:KeyboardEvent)=>{const step=pageKey(event);if(!step||!desktopTyping())return;event.preventDefault();event.stopPropagation();window.parent.postMessage({type:'ion.page-key',step},location.origin);};
   const message=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='ion.page-close-check')return;window.parent.postMessage({type:'ion.page-close-result',allowed:!cloudDrafts.hasPictures()},location.origin);};
   const focus=()=>window.parent.postMessage({type:'ion.page-focus'},location.origin);
   window.addEventListener('keydown',key,true);window.addEventListener('message',message);window.addEventListener('pointerdown',focus,{passive:true});window.addEventListener('focus',focus);
   return()=>{window.removeEventListener('keydown',key,true);window.removeEventListener('message',message);window.removeEventListener('pointerdown',focus);window.removeEventListener('focus',focus);};
  }
  let closeTimer:ReturnType<typeof setTimeout>|undefined;
  function remove(){clearTimeout(closeTimer);setLoaded(old=>old.filter(id=>id!==current.current.at(-1)?.id));setViews(old=>old.slice(0,-1));active.current=0;closing.current=false;requestAnimationFrame(()=>{if(!focusCloudComposer())host.current?.querySelector<HTMLElement>('[data-ion-primary]')?.focus({preventScroll:true});});}
  function change(step:number,source=0){
   if(!desktopTyping()||closing.current||document.querySelector('[role="dialog"],[role="alertdialog"]'))return;
   const list=current.current;
   if(step<0){if(list.length===1)return;const last=list[list.length-1];closing.current=true;const frame=frames.current.get(last.id);if(frame?.contentWindow){frame.contentWindow.postMessage({type:'ion.page-close-check'},location.origin);closeTimer=setTimeout(()=>{closing.current=false;setNotice('This view is still loading. Try again.');},1500);}else remove();return;}
   if(!host.current)return;
   const next=pageLayout(list.length+1,host.current.clientWidth,host.current.clientHeight);
   if(next.tiles.some(t=>t.width<210||t.height<190)){setNotice('No more room for another view.');return;}
   let url=window.location.href;try{url=frames.current.get(source)?.contentWindow?.location.href||url;}catch{}
   // Every view stays on this app; external redirects keep their own tab.
   if(new URL(url).origin!==location.origin)return;
   setViews(old=>[...old,{id:old.length,url}]);setNotice('');
  }
  const key=(event:KeyboardEvent)=>{const step=pageKey(event);if(!step||!desktopTyping())return;if(step<0&&current.current.length===1)return;event.preventDefault();event.stopPropagation();change(step,active.current);};
  const message=(event:MessageEvent)=>{
   if(event.origin!==location.origin)return;const entry=[...frames.current].find(([,frame])=>frame.contentWindow===event.source);if(!entry)return;
   if(event.data?.type==='ion.page-focus')active.current=entry[0];
   if(event.data?.type==='ion.page-key'&&(event.data.step===1||event.data.step===-1)){active.current=entry[0];change(event.data.step,entry[0]);}
   if(event.data?.type==='ion.page-close-result'&&closing.current&&entry[0]===current.current.at(-1)?.id){clearTimeout(closeTimer);if(event.data.allowed===true)remove();else{closing.current=false;setNotice('Save or remove pictures in the last view first.');}}
  };
  window.addEventListener('keydown',key,true);window.addEventListener('message',message);
  return()=>{clearTimeout(closeTimer);window.removeEventListener('keydown',key,true);window.removeEventListener('message',message);};
 },[embedded]);
 if(embedded)return <>{children}</>;
 const layout=pageLayout(views.length,size.width,size.height),split=views.length>1;
 const geometry=(id:number):CSSProperties=>{const tile=layout.tiles.find(t=>t.id===id)!;return split?{left:tile.x+10,top:tile.y+10,width:Math.max(0,tile.width-20),height:Math.max(0,tile.height-20)}:{inset:0};};
 return <div ref={host} className={styles.workspace} data-page-count={views.length} data-split={split} role="group" aria-label="Page views" aria-keyshortcuts="ArrowUp ArrowDown">
 <div data-ion-primary className={styles.primary} style={geometry(0)} tabIndex={-1} onPointerDownCapture={()=>{active.current=0;}}>{children}</div>
 {views.slice(1).map(view=><div key={view.id} className={styles.pane} style={geometry(view.id)}><iframe ref={node=>{if(node)frames.current.set(view.id,node);else frames.current.delete(view.id);}} name={'ion-page-'+view.id} src={view.url} title={'Page view '+(view.id+1)} allow="clipboard-write; fullscreen" className={styles.frame} onLoad={()=>{setLoaded(old=>old.includes(view.id)?old:[...old,view.id]);}} aria-busy={!loaded.includes(view.id)}/>{!loaded.includes(view.id)&&<LoadingScreen label="Opening view"/>}</div>)}
 {split&&<svg className={styles.dividers} width="100%" height="100%" aria-hidden="true">{layout.dividers.map(line=><line key={line.id} {...line} id={undefined}/>)}</svg>}
 <span className={styles.status} role="status">{notice}</span>
 </div>;
}
