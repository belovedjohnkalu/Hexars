import { engineId as resolveEngineId, isEngineId } from '../helpers/chessEngines';
import { useCallback,useEffect,useRef,useState,type MouseEvent } from 'react';
import { Link,useLocation,useNavigate,useNavigationType } from 'react-router-dom';
import { Home } from 'lucide-react';
import { AppHead } from './AppHead';
import { Button } from './Button';
import { FloatingBack } from './FloatingBack';
import { LoadingScreen } from './LoadingScreen';
import { InstallControl } from './InstallControl';
import { CloudCanvas } from './CloudCanvas';
import { CloudComposer } from './CloudComposer';
import { CloudControls } from './CloudControls';
import { OnlineSpace } from './OnlineSpace';
import { useTitleRefresh } from '../helpers/useTitleRefresh';
import { useChessHistory } from '../helpers/useChessHistory';
import { PagedText } from './PagedText';
import { RuleDiagram } from './RuleDiagram';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import { colorValue,type CloudColor } from '../helpers/cloudColors';
import { chessVariants } from '../helpers/chessVariants';
import { gameSessions } from '../helpers/gameSessions';
import { cloudTree } from '../helpers/cloudTree';
import { cloudDrafts } from '../helpers/cloudDrafts';
import { cloudScope,cloudURL,controlsURL,safeCloudReturn } from '../helpers/cloudRoutes';
import { useCloudSpace } from '../helpers/useCloudSpace';
import { useCloudHoldGuard } from '../helpers/useCloudHold';
import { useAccountCommands } from '../helpers/useAccountCommands';
import { useAuth } from '../helpers/useAuth';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { CloudPhotoDraft } from '../helpers/cloudPhotos';
import styles from './CloudExplorer.module.css';
const targets=new Map<string,string>();
export function CloudExplorer(){
 useCloudHoldGuard();
 const {authState}=useAuth(),userId=authState.type==='authenticated'?authState.user.id:null,location=useLocation(),navigate=useNavigate(),navType=useNavigationType(),params=new URLSearchParams(location.search),scope=cloudScope(params),id=params.get('cloud')||'ion';
 const historyPage=['chess-history','game-history','shared-games','shared-sent','shared-received'].includes(id)||id.startsWith('history-'),onlinePage=id==='online-lobby'||id==='online-join',history=useChessHistory(userId,scope==='chess'||id==='controls'&&params.has('game'));
 const space=useCloudSpace(userId,authState.type==='loading',scope),nodes=[...space.nodes,...history.nodes],current=nodes.find(n=>n.id===id),dev=space.dev===true&&space.userId===userId,isION=scope==='home'&&id==='ion',isControls=scope==='home'&&id==='controls',privateLocked=scope==='private'&&!userId&&authState.type!=='loading',missing=!current&&space.ready&&!history.loading;
 const [homeSettled,setHomeSettled]=useState(false),[opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(''),[added,setAdded]=useState<string|null>(null),[keyboard,setKeyboard]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null),app=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const accounts=useAccountCommands(space.retry,setNotice);
 const draftKey=scope+':'+(userId||'guest')+':'+id,onDraft=useCallback((draft:{name:string;file?:File;photos?:CloudPhotoDraft[];color?:CloudColor})=>cloudDrafts.set(draftKey,draft),[draftKey]);
 const label=current?.name||(privateLocked?'Private':'Opening…'),scopeRoot=scope==='chess'?'hexagonal-chess':scope==='home'?'ion':scope;
 const returnTo=chessVariants.isId(params.get('return'))?params.get('return'):null,context=returnTo?'&return='+returnTo+'&mode='+(params.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(params.get('level')??'3')+'&engine='+(resolveEngineId(params.get('engine')))+'&saved='+encodeURIComponent(params.get('saved')||''):'';
 const parentId=current?.parentId;
 const parent=parentId?cloudURL(parentId,scope)+context:'/',homeURL=id===scopeRoot?'/':cloudURL(scopeRoot,scope),homeLabel=id===scopeRoot?'Open ION':'Open '+(scope==='chess'?'Hexagonal Chess':scope==='accounts'?'Accounts':scope==='home'?'ION':scope==='private'?'Private':'Public');
 const savedBack=gameSessions.fromHash('#'+(params.get('saved')||''));
 const backURL=isControls?safeCloudReturn(params.get('origin')):returnTo&&(id==='engines'||id==='rules'||isEngineId(id))?'/'+returnTo+'?mode='+(params.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(params.get('level')??'3')+'&engine='+(resolveEngineId(params.get('engine')))+(savedBack?'#'+new URLSearchParams({game:savedBack.gameId,key:savedBack.accessToken}):''):scope==='accounts'&&id==='accounts'?safeCloudReturn(params.get('back')):parent;
 const signInURL='/login?mode=signin&back='+encodeURIComponent(location.pathname+location.search);
 useEffect(()=>{if(!isION){setHomeSettled(false);return;}let timeout:ReturnType<typeof setTimeout>|undefined;const settle=()=>{clearTimeout(timeout);setHomeSettled(false);timeout=setTimeout(()=>setHomeSettled(true),160);};settle();visualViewport?.addEventListener('resize',settle);window.addEventListener('resize',settle);return()=>{clearTimeout(timeout);visualViewport?.removeEventListener('resize',settle);window.removeEventListener('resize',settle);};},[isION]);
 useEffect(()=>{const viewport=window.visualViewport;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0,open=(viewport?.scale??1)<1.05&&innerHeight-height>150;app.current?.style.setProperty('--visual-height',height+'px');app.current?.style.setProperty('--visual-top',top+'px');setKeyboard(open);});};update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[]);
 useEffect(()=>{setOpening(null);const state=location.state as {focusNode?:string;restoreCamera?:boolean;notice?:string}|null;setNotice(state?.notice||'');const focus=state?.focusNode||(navType==='POP'?targets.get(id):undefined);const frame=requestAnimationFrame(()=>{if(state?.restoreCamera){document.querySelector<HTMLElement>('[role=region][aria-label="Word space"]')?.focus({preventScroll:true});return;}const el=focus?document.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(focus)+'"]'):null;if(el)el.focus({preventScroll:true});else heading.current?.focus({preventScroll:true});});return()=>{cancelAnimationFrame(frame);if(timer.current)clearTimeout(timer.current);if(noticeTimer.current)clearTimeout(noticeTimer.current);};},[id,location.key]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(t);},[notice]);
 function open(e:MouseEvent<HTMLAnchorElement>,nodeId:string,destination:string){if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0)return;e.preventDefault();if(opening)return;targets.set(id,nodeId);setOpening(nodeId);timer.current=setTimeout(()=>navigate(destination,{state:{fromCloud:id}}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:120);}
 const highlight=(node:CloudNode)=>{targets.set(id,node.id);navigate(controlsURL(node,scope,location.pathname+location.search)+(node.savedGameId?'&game='+node.savedGameId+(node.shareId?'&shareId='+node.shareId:''):''),{state:{restoreCamera:true}});};
 const titleRefresh=useTitleRefresh(()=>{if(current&&!privateLocked)highlight(current);});
 const retry=()=>{if(space.ready&&(cloudDrafts.get(draftKey).name||cloudDrafts.get(draftKey).file||cloudDrafts.get(draftKey).photos?.length))(document.getElementById('cloud-composer-form') as HTMLFormElement|null)?.requestSubmit();else void space.retry();};

 const canvasProps={identity:String(userId||'guest'),nodes,scope,parentId:id,onOpen:open,opening,showIdentifiers:dev,onHighlight:highlight,onCommand:(n:CloudNode)=>void accounts.command(n)};
 return <div ref={app} className={styles.app} data-cloud={id} data-scope={scope} data-keyboard={keyboard}><AppHead title={isION?'ION':label+' · ION'}/>
 <header className={styles.header}><span>{isION?<InstallControl/>:<Button asChild variant="ghost" size="icon" className={styles.account}><Link to={homeURL} title={homeLabel} aria-label={homeLabel} style={{color:colorValue(cloudTree.roots.find(n=>n.id===scopeRoot)?.color)}}><Home size={19}/></Link></Button>}</span><div><h1 {...titleRefresh.handlers} aria-busy={titleRefresh.refreshing} id="cloud-title" ref={heading} tabIndex={-1} className={styles.title} style={{color:colorValue(current?.color)}}>{label}</h1>{id==='public'&&<p className={styles.scopeLabel}>Shared with everyone</p>}{id==='private'&&userId&&<p className={styles.scopeLabel}>Only you</p>}{scope==='accounts'&&id==='accounts'&&dev&&<p className={styles.scopeLabel}>Dev account</p>}</div><span/></header>
 <main className={styles.main} aria-label={current?.name||'Your clouds'}>
 {(historyPage&&!userId&&authState.type!=='loading')?<div className={styles.message}><p>Sign in to open History.</p><Button asChild><Link to={signInURL}>Sign in</Link></Button></div>:onlinePage?<OnlineSpace join={id==='online-join'}/>:privateLocked?<div className={styles.message}><p>Sign in to open Private.</p><Button asChild><Link to={signInURL}>Sign in</Link></Button></div>:missing?<div className={styles.message}><p>This cloud isn’t here.</p><Button asChild variant="ghost"><Link to={cloudURL(scopeRoot,scope)}>Back</Link></Button></div>:isControls?<CloudControls nodes={space.nodes} onFeedback={setNotice}/>:current?.note?<article className={styles.article}>{current.illustration&&current.variant&&<div className={styles.rulePicture}><RuleDiagram kind={current.illustration} variant={current.variant}/></div>}<div className={styles.ruleText}><PagedText text={current.note.replace("identified above.","identified here.")} link={id==='wellisch-rule-21'?{label:'here',to:'/?cloud=wellisch-rule-19'}:undefined}/></div>{space.nodes.some(n=>n.parentId===id)&&<div className={styles.noteChildren}><CloudCanvas {...canvasProps} loading={false}/></div>}</article>:<div className={styles.cloudBody}>{current&&current.name.length>160&&<div className={styles.longName}><PagedText text={current.name}/></div>}<div className={styles.childCloud}><CloudCanvas key={scope+':'+id} {...canvasProps} loading={space.loading||history.loading||(isION&&(!homeSettled||keyboard))} addedId={added} onPictureError={()=>{if(!space.busy)void space.retry();}}/></div></div>}
 {(space.loading||history.loading||(isION&&(!homeSettled||keyboard)))&&!privateLocked&&<LoadingScreen label="Opening your space"/>}
 </main>
 <footer className={styles.footer}><div className={styles.feedback}>{space.error||accounts.error||history.error?<div role="alert" className={styles.error}><span>{space.error||accounts.error||history.error}</span>{space.error&&<Button size="sm" variant="ghost" disabled={space.busy} onClick={retry}>Retry</Button>}</div>:<div role="status" aria-live="polite" className={styles.status}>{space.busy?(space.phase==='uploading'?'Uploading…':'Saving…'):accounts.busy?'Updating…':notice}{history.undo&&<Button variant="link" size="sm" onClick={()=>void history.restore()}>Undo deletion</Button>}{!history.undo&&space.undo&&<Button variant="link" size="sm" disabled={space.busy} onClick={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice('Restored');})}>Undo deletion</Button>}</div>}</div>
 <div className={styles.bottom}>
 {!missing&&!historyPage&&!onlinePage&&space.canAdd&&<CloudComposer scope={scope} colors usedColors={space.nodes.filter(n=>n.parentId===id&&!n.removedBy).map(n=>n.color)} key={draftKey} parentId={id} busy={space.busy} disabled={!space.ready} uploading={space.phase==='uploading'} onCancelUpload={()=>{space.cancelUpload();setNotice('Upload stopped');}} draft={cloudDrafts.get(draftKey)} onDraft={onDraft} onAdd={async v=>{const ok=await space.add(v);if(ok){setNotice(scope==='public'||scope==='chess'||scope==='home'?'Published':'Saved');setAdded(v.id);noticeTimer.current=setTimeout(()=>setAdded(null),1600);}return ok;}}/>}
 {scope==='public'&&!userId&&<Button variant="ghost" asChild><Link to={signInURL}>Sign in to add</Link></Button>}
 </div></footer>
 {!isION&&(!!current||!space.loading)&&<FloatingBack to={backURL} label="Back"/>}
 <Dialog open={accounts.forget!==null} onOpenChange={open=>{if(!open&&!accounts.busy)accounts.cancelForget();}}><DialogContent closeDisabled={accounts.busy}><DialogTitle>Forget this account?</DialogTitle><DialogDescription>Sign in again to open it on this device.</DialogDescription><div className={styles.confirmActions}><Button variant="ghost" disabled={accounts.busy} onClick={accounts.cancelForget}>Keep account</Button><Button disabled={accounts.busy} onClick={()=>void accounts.confirmForget()}>Forget</Button></div></DialogContent></Dialog>
 </div>;
}
