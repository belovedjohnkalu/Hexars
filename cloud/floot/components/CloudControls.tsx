import { postFeatures } from '../endpoints/features_POST.schema';
import { useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useCloudSpace } from '../helpers/useCloudSpace';
import { useAuth } from '../helpers/useAuth';
import { cloudTree } from '../helpers/cloudTree';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { cloudScope,cloudURL,controlsURL,safeCloudReturn } from '../helpers/cloudRoutes';
import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
import { CloudCanvas } from './CloudCanvas';
import { SavedGameControls } from './SavedGameControls';
import { CloudLinkEditor } from './CloudLinkEditor';
import { CloudActions } from './CloudActions';
import { CloudPhotoViewer } from './CloudPhotoViewer';
import { Button } from './Button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import { Input } from './Input';
import styles from './CloudControls.module.css';
export function CloudControls(props:{nodes:CloudNode[];onFeedback:(value:string)=>void;className?:string}){const location=useLocation();return new URLSearchParams(location.search).has('game')?<SavedGameControls onFeedback={props.onFeedback}/>:<CloudNodeControls {...props}/>;}
function CloudNodeControls({nodes,onFeedback,className=''}:{nodes:CloudNode[];onFeedback:(value:string)=>void;className?:string}){
 const location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),selectedId=params.get('selected'),source=cloudScope(new URLSearchParams({space:params.get('source')||'home'})),origin=safeCloudReturn(params.get('origin'));
 const {authState}=useAuth(),uid=authState.type==='authenticated'?authState.user.id:null,space=useCloudSpace(uid,authState.type==='loading',source,params.get('functional')||undefined),node=space.nodes.find(n=>n.id===selectedId),[mode,setMode]=useState<'rename'|'move'|'copy'|'remove'|null>(null),[linking,setLinking]=useState(false),[viewer,setViewer]=useState(false),[clipboard,setClipboard]=useState(false),[copyingText,setCopyingText]=useState(false);
 const [featureDialog,setFeatureDialog]=useState(false),[featureBusy,setFeatureBusy]=useState(false),[featureError,setFeatureError]=useState('');
 const dev=space.dev===true&&space.userId===uid;
 const allowed=(n:CloudNode)=>!!n.control&&!!node&&(n.control==='copy-text'?true:n.control==='copy-il'?(dev||source==='public')&&!!node.identifier:n.control==='view-photos'?cloudPhotoUrls(node).length>0:n.control==='copy'?!!node.canCopy:n.control==='remove'&&node.id==='home-hidden-features'?false:n.control==='remove'&&node.canHide?true:!!node.canEdit);
 const visible=nodes.filter(n=>n.parentId!=='controls'||(selectedId?allowed(n):!n.control)).map(n=>n.control==='remove'&&node?.hiddenFeature?{...n,name:'Restore'}:n);
 async function changeFeature(){if(!node?.canHide||featureBusy)return;setFeatureBusy(true);setFeatureError('');try{await postFeatures({action:node.hiddenFeature?'restore':'hide',id:node.id});const lastRestore=node.hiddenFeature&&!space.nodes.some(n=>n.id!==node.id&&n.hiddenFeature&&n.parentId==='home-hidden-features');const fromHidden=new URL(origin,'https://ion.floot.app').searchParams.get('cloud')==='home-hidden-features';done(node.hiddenFeature?'Restored':'Removed from Home',lastRestore&&fromHidden?'/':origin);}catch(e){setFeatureError(e instanceof Error?e.message:'Try again.');}finally{setFeatureBusy(false);}}
 const hasActions=visible.some(n=>n.parentId==='controls');
 const done=(message:string,to=origin)=>{navigate(to,{state:{restoreCamera:true,notice:message}});return true;};
 async function command(n:CloudNode){if(!node||!allowed(n))return;
  if(n.control==='remove'&&node.canHide){if(node.hiddenFeature)await changeFeature();else setFeatureDialog(true);return;}
  if(n.control==='copy-text'){setCopyingText(true);try{await navigator.clipboard.writeText(node.name);onFeedback('Copied');}catch{setClipboard(true);}return;}
  if(n.control==='link'){setLinking(true);return;}
  if(n.control==='view-photos'){setViewer(true);return;}
  if(n.control==='copy-il'){setCopyingText(false);try{await navigator.clipboard.writeText(node.identifier!);onFeedback('IL copied');}catch{setClipboard(true);}return;}
  if(n.control==='rename'||n.control==='move'||n.control==='copy'||n.control==='remove')setMode(n.control);
 }
 return <div className={styles.page+' '+className}>
 {selectedId&&node&&<p className={styles.selection}><span className={styles.selectionName} title={node.name}>{node.name}</span>{node.author&&<span className={styles.author}>By {node.author.name}</span>}</p>}
 {!selectedId&&!hasActions?<p className={styles.empty}>Hold a word or picture</p>:selectedId&&space.ready&&!node?<p className={styles.empty}>This word or picture isn’t here.</p>:selectedId&&space.ready&&!hasActions?<p className={styles.empty}>Read only</p>:<CloudCanvas identity={String(uid||'guest')} nodes={visible} parentId="controls" scope="home" onOpen={(e,_id,to)=>{e.preventDefault();navigate(to);}} opening={null} loading={space.loading} showIdentifiers={dev} onCommand={n=>void command(n)} onHighlight={n=>navigate(controlsURL(n,'home',location.pathname+location.search))}/>}
 {featureError&&!featureDialog&&<p role="alert">{featureError}</p>}
 <Dialog open={featureDialog} onOpenChange={open=>{if(!featureBusy)setFeatureDialog(open);}}><DialogContent closeDisabled={featureBusy}><DialogTitle>Remove from Home?</DialogTitle><DialogDescription>Find this feature and its contents in Hidden.</DialogDescription>{featureError&&<p role="alert">{featureError}</p>}<Button variant="ghost" disabled={featureBusy} onClick={()=>setFeatureDialog(false)}>Keep</Button><Button disabled={featureBusy} onClick={()=>void changeFeature()}>{featureBusy?'Removing…':'Delete'}</Button>{dev&&node?.canEdit&&<Button variant="ghost" disabled={featureBusy} onClick={()=>{setFeatureDialog(false);setMode('remove');}}>Delete for everyone</Button>}</DialogContent></Dialog>
 {space.error&&<div role="alert" className={styles.error}>{space.error}<Button variant="link" onClick={()=>void space.retry()}>Retry</Button></div>}
 {mode&&node&&<CloudActions dev={dev} onEdit={async(name,color,note,photoMode,photos)=>await space.edit(node.id,name,color,note,photoMode,photos)&&done('Saved')} node={node} nodes={space.nodes} scope={source as CloudScope} version={space.version} mode={mode} count={cloudTree.descendants(space.nodes,node.id)} busy={space.busy} error={space.error} onClose={()=>{setMode(null);space.clearError();}} loadTarget={space.loadTarget} onRename={async(name,color)=>await space.rename(node.id,name,color)&&done('Saved')} onRemove={async (op,keepChildren)=>await space.remove(node.id,cloudTree.descendants(space.nodes,node.id),op,keepChildren)&&done('Deleted',new URL(origin,'https://ion.floot.app').searchParams.get('cloud')===node.id?cloudURL(node.parentId,source):origin)} onRelocate={async(parent,copy,op,targetScope,targetVersion)=>{const result=targetScope!==source?await space.transfer(node.id,targetScope as 'public'|'private',parent,targetVersion,copy,op):await space.relocate(node.id,parent,copy,op);return result&&done(copy?'Duplicated':'Moved');}}/>}
 {linking&&node&&<CloudLinkEditor node={node} scope={source} nodes={space.nodes} busy={space.busy} saveError={space.error} onClose={()=>{setLinking(false);space.clearError();}} loadTarget={space.loadTarget} onSave={async(target,words)=>await space.link(node.id,target,words)&&done('Redirect saved')}/>}
 {viewer&&node&&<CloudPhotoViewer node={node} onClose={()=>setViewer(false)}/>}
 <Dialog open={clipboard} onOpenChange={setClipboard}><DialogContent><DialogTitle>{copyingText?'Copy':'Copy IL'}</DialogTitle><DialogDescription>Select the text to copy it.</DialogDescription><Input aria-label={copyingText?'Text':'Identifier'} readOnly value={(copyingText?node?.name:node?.identifier)||''} onFocus={e=>e.currentTarget.select()}/><Button variant="ghost" onClick={()=>setClipboard(false)}>Done</Button></DialogContent></Dialog>
 </div>;
}
