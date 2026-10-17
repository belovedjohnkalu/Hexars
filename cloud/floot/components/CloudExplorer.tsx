import { useCallback,useEffect,useRef,useState,type MouseEvent } from "react";
import { Link,useLocation,useNavigate,useNavigationType } from "react-router-dom";
import { ArrowLeft,UserRound } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { InstallControl } from "./InstallControl";
import { CloudCanvas } from "./CloudCanvas";
import { CloudComposer } from "./CloudComposer";
import { CloudActions } from "./CloudActions";
import { RuleDiagram } from "./RuleDiagram";
import { cloudTree } from "../helpers/cloudTree";
import { cloudDrafts } from "../helpers/cloudDrafts";
import { useCloudSpace } from "../helpers/useCloudSpace";
import { useAuth } from "../helpers/useAuth";
import type { CloudNode,CloudScope } from "../endpoints/cloud_POST.schema";
import styles from "./CloudExplorer.module.css";
const targets=new Map<string,string>();
const url=(id:string,scope:CloudScope)=>'/?cloud='+encodeURIComponent(id)+(scope==='public'||scope==='private'||scope==='chess'&&/^[a-f0-9-]{36}$/.test(id)?'&space='+scope:'');
export function CloudExplorer(){
 const {authState}=useAuth(),userId=authState.type==='authenticated'?authState.user.id:null,location=useLocation(),navigate=useNavigate(),navType=useNavigationType(),params=new URLSearchParams(location.search),id=params.get('cloud');
 const scope:CloudScope=!id?'home':params.get('space')==='chess'?'chess':id==='public'||params.get('space')==='public'?'public':id==='private'||params.get('space')==='private'||/^[a-f0-9-]{36}$/.test(id)?'private':'chess';
 const space=useCloudSpace(userId,authState.type==='loading',scope),current=space.nodes.find(n=>n.id===id),privateLocked=scope==='private'&&!userId&&authState.type!=='loading',missing=!!id&&!current&&space.ready;
 const [opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(''),[added,setAdded]=useState<string|null>(null),[keyboard,setKeyboard]=useState(false),[action,setAction]=useState<{node:CloudNode;mode:'rename'|'remove'|'move'|'copy'}|null>(null);
 const heading=useRef<HTMLHeadingElement>(null),app=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const draftKey=scope+':'+(userId||'guest')+':'+(id||'root'),onDraft=useCallback((draft:{name:string;file?:File})=>cloudDrafts.set(draftKey,draft),[draftKey]);
 const label=id?current?.name||(privateLocked?'Private':'Opening…'):'ION',returnTo=params.get('return'),parent=current?.parentId?url(current.parentId,scope):'/',path=cloudTree.path(space.nodes,id);
 const backURL=returnTo&&(id==='engines'||id==='rules'||id==='tactical')?'/'+returnTo:parent,accountURL='/login?back='+encodeURIComponent(location.pathname+location.search);
 useEffect(()=>{const viewport=window.visualViewport;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0,open=innerHeight-height>150;app.current?.style.setProperty('--visual-height',height+'px');app.current?.style.setProperty('--visual-top',top+'px');setKeyboard(open);});};update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[]);
 useEffect(()=>{setOpening(null);setAction(null);setNotice('');const state=location.state as {focusNode?:string}|null,focus=state?.focusNode||(navType==='POP'?targets.get(id||'root'):undefined);const frame=requestAnimationFrame(()=>{const el=focus?document.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(focus)+'"]'):null;if(el){el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});}else heading.current?.focus({preventScroll:true});});return()=>{cancelAnimationFrame(frame);if(timer.current)clearTimeout(timer.current);if(noticeTimer.current)clearTimeout(noticeTimer.current);};},[id,location.key]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(t);},[notice]);
 function open(e:MouseEvent<HTMLAnchorElement>,nodeId:string,destination:string){if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0)return;e.preventDefault();if(opening)return;targets.set(id||'root',nodeId);setOpening(nodeId);timer.current=setTimeout(()=>navigate(destination,{state:{fromCloud:id||'root'}}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:120);}
 function edit(node:CloudNode,mode:'rename'|'remove'|'move'|'copy'){space.clearError();setAction({node,mode});}
 const retry=()=>{if(space.ready&&(cloudDrafts.get(draftKey).name||cloudDrafts.get(draftKey).file))(document.getElementById('cloud-composer-form') as HTMLFormElement|null)?.requestSubmit();else void space.retry();};
 return <div ref={app} className={styles.app} data-cloud={id||'root'} data-scope={scope} data-keyboard={keyboard}><AppHead title={id?label+' · ION':'ION'}/>
 <header className={styles.header}><span><InstallControl/></span><div><h1 id="cloud-title" ref={heading} tabIndex={-1} className={styles.title}>{label}</h1>{id==='public'&&<p className={styles.scopeLabel}>Shared with everyone</p>}{id==='private'&&userId&&<p className={styles.scopeLabel}>Only you</p>}</div><Button asChild variant="ghost" size="icon" className={styles.account}><Link to={accountURL} aria-label={userId?'Accounts':'Sign in'}><UserRound size={20}/></Link></Button></header>
 <main className={styles.main} aria-label={current?.name||'Your clouds'}>
 {privateLocked?<div className={styles.message}><p>Sign in to open Private.</p><Button asChild><Link to={accountURL}>Sign in</Link></Button></div>:current?.note?<article className={styles.article}>{current.illustration&&current.variant&&<div className={styles.rulePicture}><RuleDiagram kind={current.illustration} variant={current.variant}/></div>}<p>{current.note}</p>{space.nodes.some(n=>n.parentId===id)&&<div className={styles.noteChildren}><CloudCanvas nodes={space.nodes} scope={scope} parentId={id} onOpen={open} opening={opening} loading={false} canEdit={space.ready&&!space.busy} onAction={edit}/></div>}</article>:missing?<div className={styles.message}><p>This cloud isn’t here.</p><Button asChild variant="ghost"><Link to={scope==='home'?'/':url(scope==='chess'?'hexagonal-chess':scope,scope)}>Back to {scope==='chess'?'Hexagonal Chess':scope}</Link></Button></div>:<CloudCanvas key={scope+':'+(id||'root')} nodes={space.nodes} scope={scope} parentId={id} onOpen={open} opening={opening} loading={space.loading} addedId={added} onPictureError={()=>{if(!space.busy)void space.retry();}} onAction={edit} canEdit={space.ready&&!space.busy}/>}
 {space.loading&&!privateLocked&&<div className={styles.loading}><Spinner size="sm" aria-label="Opening your space"/></div>}
 </main>
 <footer className={styles.footer}>
 {scope!=='home'&&<div className={styles.feedback}>{space.error&&!action&&!privateLocked?<div role="alert" className={styles.error}><span>{space.error}</span><Button size="sm" variant="ghost" disabled={space.busy} onClick={retry}>Retry</Button></div>:<div role="status" aria-live="polite" className={styles.status}>{space.busy?(space.phase==='uploading'?'Uploading…':'Saving…'):notice}{space.undo&&<Button variant="link" size="sm" disabled={space.busy} onClick={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice('Restored');})}>Undo deletion</Button>}</div>}</div>}
 <div className={styles.bottom}>{id?<Button asChild variant="ghost" size="icon" className={styles.back}><Link to={backURL} state={{focusNode:current?.id}} aria-label={'Back to '+(returnTo&&(id==='engines'||id==='rules'||id==='tactical')?'variant':current?.parentId?space.nodes.find(n=>n.id===current.parentId)?.name||'parent':'Home')}><ArrowLeft size={22}/></Link></Button>:null}
 {!missing&&space.canAdd&&scope!=='home'&&id&&<CloudComposer key={draftKey} parentId={id} busy={space.busy} disabled={!space.ready} uploading={space.phase==='uploading'} onCancelUpload={()=>{space.cancelUpload();setNotice('Upload stopped');}} draft={cloudDrafts.get(draftKey)} onDraft={onDraft} onAdd={async v=>{const ok=await space.add(v);if(ok){setNotice(scope==='public'||scope==='chess'?'Published':'Saved');setAdded(v.id);noticeTimer.current=setTimeout(()=>setAdded(null),1600);}return ok;}}/>}
 {scope==='public'&&!userId&&<Button variant="ghost" asChild><Link to={accountURL}>Sign in to add</Link></Button>}
 </div></footer>
 {action&&<CloudActions key={action.mode+action.node.id} node={action.node} nodes={space.nodes} scope={scope} version={space.version} mode={action.mode} count={cloudTree.descendants(space.nodes,action.node.id)} busy={space.busy} error={space.error} loadTarget={space.loadTarget} onClose={()=>{setAction(null);space.clearError();}} onRename={async name=>{const ok=await space.rename(action.node.id,name);if(ok)setNotice('Saved');return ok;}} onRemove={async op=>{const ok=await space.remove(action.node.id,cloudTree.descendants(space.nodes,action.node.id),op);if(ok){setNotice('Deleted');if(path.some(n=>n.id===action.node.id))navigate(action.node.parentId?url(action.node.parentId,scope):'/');}return ok;}} onRelocate={async(parent,copy,op,targetScope,targetVersion)=>{const cross=targetScope!==scope;const ok=cross?await space.transfer(action.node.id,targetScope as 'public'|'private',parent,targetVersion,copy,op):await space.relocate(action.node.id,parent,copy,op);if(ok){setNotice(copy?'Copied':'Moved');if(cross&&!copy&&id===action.node.id)navigate(url(scope,scope));}return ok;}}/>}
 </div>;
}
