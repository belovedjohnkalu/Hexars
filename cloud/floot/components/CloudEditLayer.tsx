import {useCallback,useEffect,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '../helpers/useAuth';
import {useCloudSpace} from '../helpers/useCloudSpace';
import {cloudDrafts} from '../helpers/cloudDrafts';
import {cloudPhotoUrls} from '../helpers/cloudPhotos';
import type {CloudEditRequest} from '../helpers/cloudEditRequest';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
import {CloudComposer,type CloudSubmission} from './CloudComposer';
import {ComposerDock} from './ComposerDock';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './Dialog';
import {Button} from './Button';
import styles from './CloudEditLayer.module.css';
export function CloudEditLayer(){
 const {authState}=useAuth(),identity=authState.type==='authenticated'?authState.user.id:null,location=useLocation(),navigate=useNavigate(),[request,setRequest]=useState<(CloudEditRequest&{nonce:string;origin:string})|null>(null),seen=useRef('');
 useEffect(()=>{setRequest(null);},[identity]);
 useEffect(()=>{const open=(e:Event)=>{const data=(e as CustomEvent<CloudEditRequest>).detail;if(!data||!identity||typeof data.id!=='string'||!['home','chess','public','private','schedule','accounts'].includes(data.scope))return;setRequest(old=>old||{...data,nonce:crypto.randomUUID(),origin:location.pathname+location.search+location.hash});};window.addEventListener('ion.edit-cloud',open);return()=>window.removeEventListener('ion.edit-cloud',open);},[identity,location.pathname,location.search,location.hash]);
 useEffect(()=>{const wanted=(location.state as {editCloud?:CloudEditRequest}|null)?.editCloud;if(wanted&&seen.current!==location.key&&identity){seen.current=location.key;setRequest(old=>old||{...wanted,nonce:crypto.randomUUID(),origin:location.pathname+location.search+location.hash});navigate(location.pathname+location.search+location.hash,{replace:true,state:{...(location.state||{}),editCloud:undefined}});}},[location.key,identity,navigate]);
 return request&&identity?<CloudEditor key={request.nonce} request={request} userId={identity} onClose={()=>setRequest(null)}/>:null;
}
function CloudEditor({request,userId,onClose}:{request:CloudEditRequest&{nonce:string;origin:string};userId:number;onClose:()=>void}){
 const space=useCloudSpace(userId,false,request.scope,request.functional),[initial,setInitial]=useState<{node:CloudNode;version:number}|null>(null),[discard,setDiscard]=useState(false),[keyboard,setKeyboard]=useState({height:innerHeight,top:0}),draftKey=request.scope+':'+userId+':edit:'+request.id;
 const closed=useRef(false),writeDraft=useCallback((draft:Parameters<typeof cloudDrafts.set>[1])=>cloudDrafts.set(draftKey,draft),[draftKey]);
 useEffect(()=>{if(!space.ready||initial)return;const node=space.nodes.find(n=>n.id===request.id&&n.canEdit&&!n.lockedItem);if(!node)return;setInitial({node,version:space.version});cloudDrafts.set(draftKey,{name:node.name,color:node.color,retainMedia:cloudPhotoUrls(node).map((_,i)=>i)});},[space.ready,space.nodes,space.version,initial,draftKey]);
 useEffect(()=>{document.documentElement.dataset.ionEditing='true';const update=()=>setKeyboard({height:visualViewport?.height||innerHeight,top:visualViewport?.offsetTop||0});update();visualViewport?.addEventListener('resize',update);visualViewport?.addEventListener('scroll',update);return()=>{delete document.documentElement.dataset.ionEditing;visualViewport?.removeEventListener('resize',update);visualViewport?.removeEventListener('scroll',update);};},[]);
 useEffect(()=>{if(!initial)return;const frame=requestAnimationFrame(()=>{const input=document.querySelector<HTMLInputElement>('[data-cloud-editor] [data-cloud-input]');input?.focus({preventScroll:true});input?.select();});return()=>cancelAnimationFrame(frame);},[initial]);
 function dirty(){if(!initial)return false;const d=cloudDrafts.get(draftKey);return d.name!==initial.node.name||d.color!==initial.node.color||!!d.photos?.length||JSON.stringify(d.retainMedia)!==JSON.stringify(cloudPhotoUrls(initial.node).map((_,i)=>i));}
 useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(dirty()&&!closed.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[initial,draftKey]);
 function close(){closed.current=true;cloudDrafts.set(draftKey,{name:''});onClose();}
 function cancel(){if(space.busy)return;if(dirty())setDiscard(true);else close();}
 async function save(value:CloudSubmission){if(!initial)return false;const photos=value.photos||[],retained=value.retainMedia||[],original=cloudPhotoUrls(initial.node).map((_,i)=>i),mediaChanged=photos.length>0||JSON.stringify(retained)!==JSON.stringify(original),mode=photos.length?'replace' as const:mediaChanged?'remove' as const:'keep' as const;
  // Retaining some existing files is a subset update, not a complete removal.
  const photoMode=mode==='remove'&&retained.length?'keep':mode;
  const ok=await space.edit(value.id,value.name,value.color,undefined,photoMode,photos,mediaChanged?retained:undefined,initial.version);if(ok){window.dispatchEvent(new CustomEvent('ion.cloud-feedback',{detail:'Saved'}));close();}return ok;
 }
 return <section data-cloud-editor className={styles.layer} aria-label="Edit cloud" style={{top:keyboard.top,height:keyboard.height}}><div className={styles.footer}>
 {!initial?<div className={styles.message}><span role={space.error?'alert':'status'}>{space.error|| (space.ready?'This cloud can’t be edited.':'Opening editor…')}</span><Button variant="ghost" onClick={close}>Close</Button></div>:<><p className={styles.title}>Edit{initial.node.identifier?' · '+initial.node.identifier:''}</p><ComposerDock editing to={request.origin}><CloudComposer dev={space.dev===true&&space.userId===userId} key={request.nonce} editNode={initial.node} storageKey={draftKey} parentId={initial.node.parentId} nodes={space.nodes} scope={request.scope} usedColors={space.nodes.filter(n=>n.id!==initial.node.id&&n.parentId===initial.node.parentId).map(n=>n.color)} colors busy={space.busy} disabled={!space.ready} uploading={space.phase==='uploading'} onCancelUpload={space.cancelUpload} onCancel={cancel} draft={cloudDrafts.get(draftKey)} onDraft={writeDraft} onAdd={save}/></ComposerDock>{space.error&&<p role="alert" className={styles.error}>{space.error}</p>}</>}
 </div><Dialog open={discard} onOpenChange={setDiscard}><DialogContent><DialogTitle>Discard edit?</DialogTitle><DialogDescription>Your changes haven’t been saved.</DialogDescription><Button variant="ghost" onClick={()=>setDiscard(false)}>Keep editing</Button><Button onClick={close}>Discard</Button></DialogContent></Dialog></section>;
}
