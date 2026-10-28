import {openCloudControls} from '../helpers/cloudControlPopup';
import {PuzzleSpace} from './PuzzleSpace';
import {useChessDay} from '../helpers/useChessDay';
import {useChessResume} from '../helpers/useChessResume';
import {chessToday,communityId,chessHubId} from '../helpers/chessHubClouds';
import {CommunitySpace} from './CommunitySpace';
import {ChessHubSettings} from './ChessHubSettings';
import {ComposerDock} from './ComposerDock';
import {CloudContentViewer} from './CloudContentViewer';
import {CloudILSearch} from './CloudILSearch';
import {checkersRoot} from '../helpers/checkersClouds';
import { scheduleCalendar } from '../helpers/scheduleCalendar';
import { useScheduleCalendar } from '../helpers/useScheduleCalendar';
import {useTimeTotals} from '../helpers/useTimeTotals';
import {timeHubNodes} from '../helpers/timePresentation';
import {Input} from './Input';
import { useTime } from '../helpers/useTime';
import { featureClouds } from '../helpers/featureClouds';
import { desktopTyping,focusCloudComposer } from '../helpers/cloudTyping';
import { TimeSpace } from './TimeSpace';
import { TimeAccess } from './TimeAccess';
import { engineId as resolveEngineId, isEngineId } from '../helpers/chessEngines';
import { useCallback,useEffect,useMemo,useRef,useState,type MouseEvent } from 'react';
import { Link,useLocation,useNavigate,useNavigationType } from 'react-router-dom';
import { Home,Search } from 'lucide-react';
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
import { cloudScope,cloudURL,safeCloudReturn } from '../helpers/cloudRoutes';
import { useCloudSpace } from '../helpers/useCloudSpace';
import { useCloudHoldGuard } from '../helpers/useCloudHold';
import { useAccountCommands } from '../helpers/useAccountCommands';
import { useAuth } from '../helpers/useAuth';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { CloudPhotoDraft } from '../helpers/cloudPhotos';
import styles from './CloudExplorer.module.css';
const targets=new Map<string,string>();
export function CloudExplorer(){const location=useLocation(),{authState}=useAuth(),params=new URLSearchParams(location.search),id=params.get('cloud')||'';return id.startsWith('time-')?<TimeSpace/>:cloudScope(params)==='schedule'&&authState.type==='authenticated'?<TimeAccess items={['feature:schedule']}><CloudExplorerBody/></TimeAccess>:<CloudExplorerBody/>;}
function CloudExplorerBody(){
 useCloudHoldGuard();
 const time=useTime();
 const {authState}=useAuth(),userId=authState.type==='authenticated'?authState.user.id:null,location=useLocation(),navigate=useNavigate(),navType=useNavigationType(),params=new URLSearchParams(location.search),scope=cloudScope(params),id=params.get('cloud')||'ion';
 const historyPage=['chess-history','game-history','shared-games','shared-sent','shared-received'].includes(id)||id.startsWith('history-'),onlinePage=id==='online-lobby'||id==='online-join',history=useChessHistory(userId,historyPage||id==='controls'&&params.has('game'));
 const resume=useChessResume(userId),chessDay=useChessDay();
 const totals=useTimeTotals(time.snapshot,'paused');
 const visibilityKey=time.snapshot?time.snapshot.products.map(p=>p.id+':'+Number(p.owned)+':'+Number(p.affordable)).join('|'):undefined;
 const galleryMarket=useMemo(()=>({products:time.snapshot?.products??[],dev:!!time.snapshot?.dev}),[visibilityKey,time.snapshot?.dev]);
 const space=useCloudSpace(userId,authState.type==='loading',scope,undefined,visibilityKey),baseNodes=useMemo(()=>scope==='chess'?chessToday(featureClouds([...space.nodes,...history.nodes].flatMap(n=>n.id!=='chess-continue'?[n]:resume?[{...n,sizeCharacters:resume.characters,href:'/'+resume.variant+'?mode='+(resume.mode==='two_players'?'friend':resume.mode==='online'?'online':'engine')+'&level='+resume.difficulty+'#'+gameSessions.hash(resume)}]:space.dev?[n]:[]),galleryMarket.products,galleryMarket.dev),chessDay):scope==='home'?featureClouds(timeHubNodes([...space.nodes,...history.nodes],time.snapshot,totals),time.snapshot?.products??[],!!time.snapshot?.dev):scope==='accounts'?space.nodes.map(n=>n.id==='account-signed-in-users'&&typeof space.signedInUsers==='number'?{...n,name:n.name+' · '+space.signedInUsers}:n):[...space.nodes,...history.nodes],[space.nodes,space.signedInUsers,history.nodes,scope,scope==='home'?time.snapshot:null,galleryMarket,resume,chessDay,totals.addedUs,totals.spentUs,totals.balanceUs]);
 const nodes=useScheduleCalendar(baseNodes,space.timeZone,space.retry),current=nodes.find(n=>n.id===id),dev=space.dev===true&&space.userId===userId,isION=scope==='home'&&id==='ion',isControls=scope==='home'&&id==='controls',privateLocked=(scope==='private'||scope==='schedule')&&!userId&&authState.type!=='loading',missing=!current&&space.ready&&!history.loading;
 const previousHub=useRef(id);
 useEffect(()=>{if(previousHub.current!==id&&scope==='chess'&&(id===communityId||id===chessHubId)&&space.ready)void space.retryLive();previousHub.current=id;},[id,scope]);
 const [searchOpen,setSearchOpen]=useState(false),[contentOpen,setContentOpen]=useState(false);
 const [homeSettled,setHomeSettled]=useState(false),[opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(''),[added,setAdded]=useState<string|null>(null),[keyboard,setKeyboard]=useState(false),[copiedText,setCopiedText]=useState('');
 const heading=useRef<HTMLHeadingElement>(null),app=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const accounts=useAccountCommands(space.retry,setNotice);
 const draftKey=scope+':'+(userId||'guest')+':'+id,onDraft=useCallback((draft:{name:string;file?:File;photos?:CloudPhotoDraft[];color?:CloudColor})=>cloudDrafts.set(draftKey,draft),[draftKey]);
 const label=current?.name||(privateLocked?(scope==='schedule'?'Schedule':'Journal'):missing?'Not found':history.error?'Unavailable':'Opening…'),scopeRoot=scope==='chess'?'hexagonal-chess':scope==='home'?'ion':scope==='schedule'?scheduleCalendar.root:scope;
 const returnTo=chessVariants.isId(params.get('return'))?params.get('return'):null,context=returnTo?'&return='+returnTo+'&mode='+(params.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(params.get('level')??'3')+'&engine='+(resolveEngineId(params.get('engine')))+'&saved='+encodeURIComponent(params.get('saved')||''):'';
 useEffect(()=>{if(scope==='chess'&&isEngineId(id))navigate(cloudURL('engines','chess')+context,{replace:true});else if(scope==='chess'&&id==='engines'&&!returnTo)navigate(cloudURL('boards','chess'),{replace:true});},[scope,id,returnTo,navigate]);
 useEffect(()=>{if(scope==='chess'&&['checkers-computer','checkers-online','checkers-matchmaking','checkers-code','checkers-create'].includes(id)&&!chessVariants.isCheckers(returnTo))navigate(cloudURL(checkersRoot,'chess'),{replace:true});},[scope,id,returnTo,navigate]);
 const parentId=current?.parentId;
 const parent=parentId?cloudURL(parentId,scope)+context:'/',homeURL=id===scopeRoot?'/':cloudURL(scopeRoot,scope),homeLabel=id===scopeRoot?'Open ION':'Open '+(scope==='chess'?(time.snapshot?.labels?.['hexagonal-chess']||'Board Games'):scope==='accounts'?'Accounts':scope==='home'?'ION':scope==='schedule'?'Schedule':scope==='private'?'Journal':'Hub');
 const savedBack=gameSessions.fromHash('#'+(params.get('saved')||''));
 const backURL=isControls?safeCloudReturn(params.get('origin')):returnTo&&(id==='engines'||id==='rules'||id==='checkers-computer'||id===returnTo+'-rules'||isEngineId(id))?'/'+returnTo+'?mode='+(params.get('mode')==='friend'?'friend':'engine')+'&level='+encodeURIComponent(params.get('level')??'3')+'&engine='+(resolveEngineId(params.get('engine')))+(savedBack?'#'+new URLSearchParams({game:savedBack.gameId,key:savedBack.accessToken}):''):scope==='accounts'&&id==='accounts'?safeCloudReturn(params.get('back')):parent;
 const signInURL='/login?mode=signin&back='+encodeURIComponent(location.pathname+location.search);
 useEffect(()=>{const original=baseNodes.find(n=>n.id===id);if(scope==='home'&&(id===scheduleCalendar.root||original?.calendarDate))navigate(cloudURL(id,'schedule'),{replace:true,state:location.state});},[scope,id,baseNodes,navigate]);
 useEffect(()=>{if(!isION){setHomeSettled(false);return;}let timeout:ReturnType<typeof setTimeout>|undefined;const settle=()=>{clearTimeout(timeout);setHomeSettled(false);timeout=setTimeout(()=>setHomeSettled(true),160);};settle();visualViewport?.addEventListener('resize',settle);window.addEventListener('resize',settle);return()=>{clearTimeout(timeout);visualViewport?.removeEventListener('resize',settle);window.removeEventListener('resize',settle);};},[isION]);
 useEffect(()=>{const viewport=window.visualViewport;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0,open=(viewport?.scale??1)<1.05&&innerHeight-height>150;app.current?.style.setProperty('--visual-height',height+'px');app.current?.style.setProperty('--visual-top',top+'px');setKeyboard(open);});};update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[]);
 useEffect(()=>{setContentOpen(false);setOpening(null);const state=location.state as {focusNode?:string;restoreCamera?:boolean;notice?:string}|null;setNotice(state?.notice||'');const focus=state?.focusNode||(navType==='POP'?targets.get(id):undefined);const frame=requestAnimationFrame(()=>{if(state?.restoreCamera){document.querySelector<HTMLElement>('[role=region][aria-label="Cloud"]')?.focus({preventScroll:true});return;}if(document.activeElement?.hasAttribute('data-cloud-input')||focusCloudComposer())return;const el=focus?document.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(focus)+'"]'):null;if(el)el.focus({preventScroll:true});else if(!focusCloudComposer())heading.current?.focus({preventScroll:true});});return()=>{cancelAnimationFrame(frame);if(timer.current)clearTimeout(timer.current);if(noticeTimer.current)clearTimeout(noticeTimer.current);};},[id,location.key]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(t);},[notice]);
 function open(e:MouseEvent<HTMLAnchorElement>,nodeId:string,destination:string){if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0)return;e.preventDefault();if(opening)return;targets.set(id,nodeId);if(desktopTyping()||document.activeElement?.hasAttribute('data-cloud-input')){navigate(destination,{state:{fromCloud:id}});return;}setOpening(nodeId);timer.current=setTimeout(()=>navigate(destination,{state:{fromCloud:id}}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:120);}
 const highlight=(node:CloudNode)=>{targets.set(id,node.id);openCloudControls(node,scope,location.pathname+location.search+location.hash,node.savedGameId?{game:node.savedGameId,...(node.shareId?{shareId:node.shareId}:{})}:{});};
 const titleRefresh=useTitleRefresh(()=>{if(current&&!privateLocked)highlight(current);},()=>{if(current&&!privateLocked)setContentOpen(true);});
 const retry=()=>{if(!space.error&&history.error){void history.retry();return;}if(space.ready&&(cloudDrafts.get(draftKey).name||cloudDrafts.get(draftKey).file||cloudDrafts.get(draftKey).photos?.length))(document.getElementById('cloud-composer-form') as HTMLFormElement|null)?.requestSubmit();else void space.retry();};

 const puzzleVariant=scope==='chess'&&id.startsWith('puzzle-')&&chessVariants.isId(id.slice(7))?id.slice(7) as import('../endpoints/game_POST.schema').VariantId:null;
 const communityRoom=scope==='chess'&&(id==='chess-following'||current?.parentId===communityId&&!['chess-guidelines','chess-settings'].includes(id));
 const canCompose=!communityRoom&&id!=='chess-settings'&&!missing&&(!historyPage||dev)&&!onlinePage&&(!isControls||!params.has('selected')&&!params.has('game'))&&space.canAdd;
 const canvasProps={onDropCloud:(source:CloudNode,target:CloudNode)=>space.relocate(source.id,target.id,false,crypto.randomUUID()),tabularNumbers:id==='time'||scope==='accounts',identity:String(userId||'guest'),nodes,scope,parentId:id,onOpen:open,opening,showIdentifiers:dev,onHighlight:highlight,onCommand:(n:CloudNode)=>{if(n.control==='copy-text')void navigator.clipboard.writeText(n.name).then(()=>setNotice('Copied')).catch(()=>setCopiedText(n.name));else void accounts.command(n);}};
 return <div data-page-characters={Array.from(label).length+Array.from(current?.note||'').length+(cloudTree.descendantCharacterWeights(nodes).get(id)||0)} ref={app} className={styles.app} data-cloud={id} data-scope={scope} data-keyboard={keyboard}><AppHead title={isION?'ION':label+' · ION'} iconUrl={id==='time'?current?.imageUrl:undefined}/>
 <header className={styles.header}><span>{isION?<InstallControl/>:<Button asChild variant="ghost" size="icon" className={styles.account}><Link to={homeURL} title={homeLabel} aria-label={homeLabel} style={{color:colorValue(cloudTree.roots.find(n=>n.id===scopeRoot)?.color)}}><Home size={19}/></Link></Button>}</span><div><h1 aria-busy={titleRefresh.refreshing} id="cloud-title" ref={heading} tabIndex={-1} className={styles.title} style={{color:colorValue(current?.color)}}><button type="button" {...titleRefresh.handlers} onClick={titleRefresh.handlers.onClick}>{label}</button></h1>{scope==='accounts'&&id==='accounts'&&dev&&<p className={styles.scopeLabel}>Dev account</p>}</div><span/></header>
 <main className={styles.main} aria-label={current?.name||'Your clouds'}>
 {(historyPage&&!userId&&authState.type!=='loading')?<div className={styles.message}><p>Sign in to open History.</p><Button asChild><Link to={signInURL}>Sign in</Link></Button></div>:onlinePage?<OnlineSpace join={id==='online-join'}/>:privateLocked?<div className={styles.message}><p>Sign in to open {scope==='schedule'?'Schedule':'Journal'}.</p><Button asChild><Link to={signInURL}>Sign in</Link></Button></div>:history.error&&historyPage?<div className={styles.message}><p>Library unavailable</p></div>:missing?<div className={styles.message}><p>This page isn’t here.</p><Button asChild variant="ghost"><Link to={cloudURL(scopeRoot,scope)}>Back</Link></Button></div>:isControls?<CloudControls nodes={space.nodes} onFeedback={setNotice}/>:id==='chess-settings'&&scope==='chess'?<ChessHubSettings dev={dev} nodes={nodes}/>:communityRoom?<CommunitySpace key={id+':'+(userId||'guest')} roomId={id} nodes={nodes} userId={userId} dev={dev}/>:current?.lockedItem?<TimeAccess items={[current.lockedItem]}><span/></TimeAccess>:puzzleVariant?<PuzzleSpace key={puzzleVariant+':'+(userId??'guest')} variant={puzzleVariant} nodes={nodes} userId={userId} dev={dev}/>:current?.note?<article className={styles.article}>{current.illustration&&current.variant&&<div className={styles.rulePicture}><RuleDiagram kind={current.illustration} variant={current.variant}/></div>}<div className={styles.ruleText}><PagedText text={current.note.replace("identified above.","identified here.")} link={id==='wellisch-rule-21'?{label:'here',to:'/?cloud=wellisch-rule-19'}:undefined}/></div>{space.nodes.some(n=>n.parentId===id)&&<div className={styles.noteChildren}><CloudCanvas {...canvasProps} loading={false}/></div>}</article>:<div className={styles.cloudBody}><div className={styles.childCloud}><CloudCanvas key={scope+':'+id} {...canvasProps} loading={space.loading||history.loading||id==='time'&&time.loading||(isION&&(!homeSettled||time.loading&&!time.snapshot))} addedId={added} onPictureError={()=>{if(!space.busy)void space.retry();}}/></div></div>}
 {(space.loading||history.loading||id==='time'&&time.loading||(isION&&(!homeSettled||time.loading&&!time.snapshot)))&&!privateLocked&&<LoadingScreen label="Opening your cloud"/>}
 </main>
 <footer className={styles.footer}><div className={styles.feedback} onPointerDown={e=>{if(document.activeElement?.hasAttribute('data-cloud-input')&&(e.target as HTMLElement).closest('button'))e.preventDefault();}}>{space.offline&&<span role="status">Offline · saved on this device</span>}{space.pendingJobs.filter(j=>j.status==='failed').slice(0,1).map(j=><div key={j.id} className={styles.error} role="alert"><span>{j.error||'Couldn’t publish'}</span><Button variant="ghost" size="sm" onClick={()=>void space.retryPending(j.id)}>Retry</Button><Button variant="ghost" size="sm" onClick={()=>void space.discardPending(j.id)}>Discard</Button></div>)}{space.error||accounts.error||history.error?<div role="alert" className={styles.error}><span>{space.error||accounts.error||history.error}</span>{(space.error||history.error)&&<Button size="sm" variant="ghost" disabled={space.busy||history.loading} onClick={retry}>Retry</Button>}</div>:<div role="status" aria-live="polite" className={styles.status}>{space.busy?(space.phase==='uploading'?'Uploading…':'Saving…'):accounts.busy?'Updating…':notice||(id==='time'&&time.earning==='earning'?'Live · saved every 15 seconds':'')}{history.undo&&<Button variant="link" size="sm" onClick={()=>void history.restore()}>Undo deletion</Button>}{!history.undo&&space.undo&&<Button variant="link" size="sm" disabled={space.busy} onClick={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice('Restored');})}>Undo deletion</Button>}</div>}</div>
 <div className={styles.bottom}>
 {canCompose&&<ComposerDock root={isION} to={backURL}><CloudComposer onEnter={value=>navigate(cloudURL(value.id,scope))} storageKey={draftKey} onSearch={scope==='public'?()=>setSearchOpen(true):undefined} nodes={space.nodes} scope={scope} colors usedColors={space.nodes.filter(n=>n.parentId===id&&!n.removedBy).map(n=>n.color)} parentId={id} busy={space.busy} disabled={!space.ready} uploading={space.phase==='uploading'} onCancelUpload={()=>{space.cancelUpload();setNotice('Upload stopped');}} draft={cloudDrafts.get(draftKey)} onDraft={onDraft} onAdd={async v=>{const ok=await (v.openAfter?space.publish(v):space.add(v));if(ok){setNotice('');setAdded(v.id);noticeTimer.current=setTimeout(()=>setAdded(null),1600);}return ok;}}/></ComposerDock>}
 {scope==='public'&&!userId&&<Button variant="ghost" size="icon" aria-label="Search Hub" onClick={()=>setSearchOpen(true)}><Search size={22}/></Button>}
 {scope==='public'&&!userId&&<Button variant="ghost" asChild><Link to={signInURL}>Sign in to add</Link></Button>}
 </div></footer>
 {!canCompose&&(!!current||!space.loading)&&<FloatingBack root={isION} to={backURL} label="Back"/>}
 <>{searchOpen&&<CloudILSearch onClose={()=>setSearchOpen(false)}/>}</>
 {contentOpen&&current&&<CloudContentViewer node={current} onClose={()=>setContentOpen(false)}/>}
 <Dialog open={!!copiedText} onOpenChange={open=>{if(!open)setCopiedText('');}}><DialogContent><DialogTitle>Copy</DialogTitle><DialogDescription>Select the text to copy it.</DialogDescription><Input readOnly aria-label="Text to copy" value={copiedText} onFocus={e=>e.currentTarget.select()}/></DialogContent></Dialog>
 <Dialog open={accounts.forget!==null} onOpenChange={open=>{if(!open&&!accounts.busy)accounts.cancelForget();}}><DialogContent closeDisabled={accounts.busy}><DialogTitle>Forget this account?</DialogTitle><DialogDescription>Sign in again to open it on this device.</DialogDescription><div className={styles.confirmActions}><Button variant="ghost" disabled={accounts.busy} onClick={accounts.cancelForget}>Keep account</Button><Button disabled={accounts.busy} onClick={()=>void accounts.confirmForget()}>Forget</Button></div></DialogContent></Dialog>
 </div>;
}
