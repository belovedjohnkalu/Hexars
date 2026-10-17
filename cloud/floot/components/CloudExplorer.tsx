import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { ArrowLeft, ChevronDown, UserRound } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { InstallControl } from "./InstallControl";
import { CloudCanvas } from "./CloudCanvas";
import { CloudComposer } from "./CloudComposer";
import { CloudActions } from "./CloudActions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./DropdownMenu";
import { cloudTree } from "../helpers/cloudTree";
import { cloudDrafts } from "../helpers/cloudDrafts";
import { useCloudSpace } from "../helpers/useCloudSpace";
import { useAuth } from "../helpers/useAuth";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
import styles from "./CloudExplorer.module.css";
const targets=new Map<string,string>();
export function CloudExplorer(){
 const {authState}=useAuth(),userId=authState.type==='authenticated'?authState.user.id:null;
 const space=useCloudSpace(userId,authState.type==='loading'),location=useLocation(),navigate=useNavigate(),navType=useNavigationType();
 const id=new URLSearchParams(location.search).get('cloud'),current=space.nodes.find(n=>n.id===id),missing=!!id&&!current&&space.ready;
 const [opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(''),[added,setAdded]=useState<string|null>(null),[action,setAction]=useState<{node:CloudNode;mode:'rename'|'remove'|'move'|'copy'}|null>(null);
 const title=useRef<HTMLHeadingElement>(null),app=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),last=useRef(id);
 const onDraft=useCallback((draft:{name:string;file?:File})=>cloudDrafts.set(id,draft),[id]);
 const returnTo=new URLSearchParams(location.search).get('return');
 const label=current?.name||(id?'Opening…':'ION'),parent=current?.parentId?'/?cloud='+encodeURIComponent(current.parentId)+(returnTo?'&return='+encodeURIComponent(returnTo):''):'/',path=cloudTree.path(space.nodes,id);
 useEffect(()=>{const v=window.visualViewport;const resize=()=>app.current?.style.setProperty('--viewport-height',(v?.height||innerHeight)+'px');resize();v?.addEventListener('resize',resize);return()=>v?.removeEventListener('resize',resize);},[]);
 useEffect(()=>{setOpening(null);setAction(null);if(last.current!==id){setNotice('');last.current=id;}const key=id||'root',state=location.state as {focusNode?:string}|null;const focus=state?.focusNode||(navType==='POP'?targets.get(key):undefined);const frame=requestAnimationFrame(()=>{const el=focus?document.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(focus)+'"]'):null;if(el){el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});}else title.current?.focus({preventScroll:true});});return()=>{cancelAnimationFrame(frame);if(timer.current)clearTimeout(timer.current);};},[id,location.key]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t);},[notice]);
 function open(e:MouseEvent<HTMLAnchorElement>,nodeId:string,url:string){if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0)return;e.preventDefault();if(opening)return;targets.set(id||'root',nodeId);setOpening(nodeId);timer.current=setTimeout(()=>navigate(url,{state:{fromCloud:id||'root'}}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:120);}
 function edit(node:CloudNode,mode:'rename'|'remove'|'move'|'copy'){space.clearError();setAction({node,mode});}
 const editable=!!current;
 const retry=()=>{if(space.ready&&(cloudDrafts.get(id).name||cloudDrafts.get(id).file))(document.getElementById('cloud-composer-form') as HTMLFormElement|null)?.requestSubmit();else void space.retry();};
 return <div ref={app} className={styles.app} data-cloud={id||'root'}><AppHead title={id?label+' · ION':'ION'}/>
 <header className={styles.header}><span><InstallControl/></span><h1 ref={title} tabIndex={-1} aria-label={label} className={styles.title}>
 <DropdownMenu><DropdownMenuTrigger asChild><Button id="cloud-title-button" variant="ghost" className={styles.titleButton} aria-label={'Cloud options for '+label}><span>{label}</span><ChevronDown size={14}/></Button></DropdownMenuTrigger><DropdownMenuContent align="center" className={styles.menu} onCloseAutoFocus={e=>{if(document.querySelector('[role="dialog"]'))e.preventDefault();}}>
 <DropdownMenuLabel>Your space</DropdownMenuLabel><DropdownMenuItem asChild><Link to="/">ION</Link></DropdownMenuItem>{path.map(n=><DropdownMenuItem key={n.id} asChild><Link to={'/?cloud='+n.id}>{n.name}</Link></DropdownMenuItem>)}
 {editable&&<><DropdownMenuSeparator/>{([['rename','Edit'],['move','Move'],['copy','Copy'],['remove','Delete']] as const).map(([mode,name])=><DropdownMenuItem key={mode} disabled={space.busy||!space.ready} onSelect={()=>edit(current,mode)}>{name}</DropdownMenuItem>)}</>}
 {space.undo&&<><DropdownMenuSeparator/><DropdownMenuItem disabled={space.busy} onSelect={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice('Restored');})}>Undo last deletion</DropdownMenuItem></>}
 <DropdownMenuSeparator/><DropdownMenuLabel>{userId?'Saved across devices':'Sign in to sync devices'}</DropdownMenuLabel><DropdownMenuItem asChild><Link to={'/login?back='+encodeURIComponent(location.pathname+location.search)}>{userId?'Account':'Sign in'}</Link></DropdownMenuItem>
 </DropdownMenuContent></DropdownMenu></h1><Button asChild variant="ghost" size="icon" className={styles.account}><Link to={'/login?back='+encodeURIComponent(location.pathname+location.search)} aria-label={userId?'Account':'Sign in to sync'}><UserRound size={20}/></Link></Button></header>
 <main className={styles.main} aria-label={current?.name||'Your clouds'}>
 {current?.note?<article className={styles.article}><h2>{path.at(-2)?.name||label}</h2>{current.note.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</article>:missing?<div className={styles.message}>This cloud isn’t in your space.<Button asChild variant="ghost"><Link to="/">Return to ION</Link></Button></div>:<CloudCanvas key={id||'root'} nodes={space.nodes} parentId={id} onOpen={open} opening={opening} loading={space.loading} addedId={added} onPictureError={()=>{if(!space.busy)void space.retry();}} onAction={edit} canEdit={space.ready&&!space.busy}/>}
 {space.loading&&<div className={styles.loading}><Spinner size="sm" aria-label="Opening your space"/></div>}
 </main>
 <footer className={styles.footer}>
 <div className={styles.feedback}>{space.error&&!action?<div role="alert" className={styles.error}><span>{space.error}</span><Button size="sm" variant="ghost" disabled={space.busy} onClick={retry}>Retry</Button></div>:<div role="status" aria-live="polite" className={styles.status}>{space.busy?(space.phase==='uploading'?'Uploading…':'Saving…'):notice}{space.undo&&notice==='Deleted'&&<Button variant="link" size="sm" onClick={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice('Restored');})}>Undo</Button>}</div>}</div>
 <div className={styles.bottom}>{id?<Button asChild variant="ghost" size="icon" className={styles.back}><Link to={returnTo&&(id==='engines'||id==='rules')?'/'+returnTo:parent} state={{focusNode:current?.id}} aria-label={'Back to '+(returnTo&&(id==='engines'||id==='rules')?'variant':current?.parentId?space.nodes.find(n=>n.id===current.parentId)?.name||'parent cloud':'ION')} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&(location.state as {fromCloud?:string}|null)?.fromCloud===(current?.parentId||'root')){e.preventDefault();navigate(-1);}}}><ArrowLeft size={22}/></Link></Button>:<span className={styles.spacer}/>}
 {!missing&&<CloudComposer key={(userId||'guest')+':'+(id||'root')} parentId={id} busy={space.busy} disabled={!space.ready} uploading={space.phase==='uploading'} onCancelUpload={()=>{space.cancelUpload();setNotice('Upload stopped');}} draft={cloudDrafts.get(id)} onDraft={onDraft} onAdd={async v=>{const ok=await space.add(v);if(ok){setNotice('Added');setAdded(v.id);setTimeout(()=>setAdded(null),1600);}return ok;}}/>}</div>
 </footer>
 {action&&<CloudActions key={action.mode+action.node.id} node={action.node} nodes={space.nodes} mode={action.mode} count={cloudTree.descendants(space.nodes,action.node.id)} busy={space.busy} error={space.error} onClose={()=>{setAction(null);space.clearError();}} onRename={async name=>{const ok=await space.rename(action.node.id,name);if(ok)setNotice('Saved');return ok;}} onRemove={async operation=>{const ok=await space.remove(action.node.id,cloudTree.descendants(space.nodes,action.node.id),operation);if(ok){setNotice('Deleted');if(path.some(n=>n.id===action.node.id))navigate(action.node.parentId?'/?cloud='+action.node.parentId:'/');}return ok;}} onRelocate={async(parent,copy,operation)=>{const ok=await space.relocate(action.node.id,parent,copy,operation);if(ok)setNotice(copy?'Copied':'Moved');return ok;}}/>}
 </div>;
}
