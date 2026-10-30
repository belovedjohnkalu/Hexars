import {useTiledUI,layoutCloud} from '../helpers/useTiledUI';
import {cloudEditRequest} from '../helpers/cloudEditRequest';
import {openCloudControls,type CloudControlRequest} from '../helpers/cloudControlPopup';
import {useCloudHold} from '../helpers/useCloudHold';
import {useMediaQuery} from '../helpers/useMediaQuery';
import {Pencil,Move,Copy,Trash2,Link2,Image,Clipboard,Hash} from 'lucide-react';
import { postFeatures } from '../endpoints/features_POST.schema';
import { useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useCloudSpace } from '../helpers/useCloudSpace';
import { useAuth } from '../helpers/useAuth';
import { cloudTree } from '../helpers/cloudTree';
import { cloudPhotoUrls } from '../helpers/cloudPhotos';
import { cloudScope,cloudURL,safeCloudReturn } from '../helpers/cloudRoutes';
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
type Props={nodes:CloudNode[];onFeedback:(value:string)=>void;className?:string;selection?:CloudControlRequest;compact?:boolean;onDismiss?:()=>void};
export function CloudControls(props:Props){const location=useLocation();const game=props.selection?!!props.selection.game:new URLSearchParams(location.search).has('game');return game?<SavedGameControls onFeedback={props.onFeedback} selection={props.selection} compact={props.compact} onDismiss={props.onDismiss}/>:<CloudNodeControls {...props}/>;}
function CloudNodeControls({nodes,onFeedback,className='',selection,compact=false,onDismiss}:Props){
 const tiled=useTiledUI(),location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),selectedId=selection?.id??params.get('selected'),source=selection?.source??cloudScope(new URLSearchParams({space:params.get('source')||'home'})),origin=selection?.origin??safeCloudReturn(params.get('origin')),functional=selection?.functional??params.get('functional')??undefined;
 const {authState}=useAuth(),uid=authState.type==='authenticated'?authState.user.id:null,space=useCloudSpace(uid,authState.type==='loading',source,functional),original=space.nodes.find(n=>n.id===selectedId),node=original?layoutCloud(original,tiled):undefined,[mode,setMode]=useState<'rename'|'move'|'copy'|'remove'|null>(null),[linking,setLinking]=useState(false),[viewer,setViewer]=useState(false),[clipboard,setClipboard]=useState(false),[copyingText,setCopyingText]=useState(false);
 const controlHold=useCloudHold(n=>{if(dev)openCloudControls(n,'home',origin);});
 const [featureDialog,setFeatureDialog]=useState(false),[featureBusy,setFeatureBusy]=useState(false),[featureError,setFeatureError]=useState('');
 const dev=space.dev===true&&space.userId===uid;
 const touchMobile=useMediaQuery('(pointer: coarse) and (hover: none)');
 const allowed=(n:CloudNode)=>!!n.control&&!!node&&!(touchMobile&&n.control==='move')&&(n.control==='copy-text'?!!node.name.trim():n.control==='copy-il'?(dev||source==='public')&&!!node.identifier:n.control==='view-photos'?cloudPhotoUrls(node).length>0:n.control==='copy'?!!node.canCopy:n.control==='remove'&&node.id==='home-hidden-features'?false:n.control==='remove'&&node.canHide?true:!!node.canEdit);
 const visible=nodes.filter(n=>n.id!=='page-tiles').filter(n=>n.parentId!=='controls'||(selectedId?allowed(n):!n.control)).map(n=>n.control==='remove'&&node?.hiddenFeature?{...n,name:'Restore'}:n);
 async function changeFeature(){if(!node?.canHide||featureBusy)return;setFeatureBusy(true);setFeatureError('');try{await postFeatures({action:node.hiddenFeature?'restore':'hide',id:node.id});const lastRestore=node.hiddenFeature&&!space.nodes.some(n=>n.id!==node.id&&n.hiddenFeature&&n.parentId==='home-hidden-features');const fromHidden=new URL(origin,'https://ion.floot.app').searchParams.get('cloud')==='home-hidden-features';done(node.hiddenFeature?'Restored':'Removed from Home',lastRestore&&fromHidden?'/':origin);}catch(e){setFeatureError(e instanceof Error?e.message:'Try again.');}finally{setFeatureBusy(false);}}
 const hasActions=visible.some(n=>n.parentId==='controls');
 const done=(message:string,to=origin)=>{if(onDismiss){onFeedback(message);onDismiss();if(to!==origin)navigate(to,{state:{restoreCamera:true,notice:message}});}else navigate(to,{state:{restoreCamera:true,notice:message}});return true;};
 async function command(n:CloudNode){if(!node||!allowed(n))return;
  if(n.control==='remove'&&node.canHide){if(node.hiddenFeature)await changeFeature();else setFeatureDialog(true);return;}
  if(n.control==='copy-text'){setCopyingText(true);try{await navigator.clipboard.writeText(node.name);onFeedback('Copied');}catch{setClipboard(true);}return;}
  if(n.control==='rename'){if(onDismiss){onDismiss();requestAnimationFrame(()=>cloudEditRequest(node,source,functional));}else navigate(origin,{state:{restoreCamera:true,editCloud:{id:node.id,scope:source,functional}}});return;}
  if(n.control==='link'){setLinking(true);return;}
  if(n.control==='view-photos'){setViewer(true);return;}
  if(n.control==='copy-il'){setCopyingText(false);try{await navigator.clipboard.writeText(node.identifier!);onFeedback('IL copied');}catch{setClipboard(true);}return;}
  if(n.control==='move'||n.control==='copy'||n.control==='remove')setMode(n.control);
 }
 const icon={rename:Pencil,move:Move,copy:Copy,remove:Trash2,'copy-il':Hash,'view-photos':Image,link:Link2,'copy-text':Clipboard};
 return <div className={(compact?styles.compact:styles.page)+' '+className}>
 {selectedId&&node&&<p className={styles.selection}><span className={styles.selectionName} title={node.name}>{node.name}</span>{node.author&&<span className={styles.author}>By {node.author.name}</span>}</p>}
 {!selectedId&&!hasActions?<p className={styles.empty}>Hold a word or picture</p>:selectedId&&!space.ready?<p role="status" className={compact?styles.compactMessage:styles.empty}>Opening…</p>:selectedId&&space.ready&&!node?<p className={compact?styles.compactMessage:styles.empty}>This word or picture isn’t here.</p>:selectedId&&space.ready&&!hasActions?<p className={compact?styles.compactMessage:styles.empty}>Read only</p>:compact?<div className={styles.actionGrid}>{visible.filter(n=>n.parentId==='controls'&&n.control).map(n=>{const Icon=icon[n.control!];return <Button key={n.id} variant="ghost" {...controlHold.handlers(n)} className={styles.action} onClick={()=>void command(n)}>{Icon&&<Icon size={19} aria-hidden="true"/>}<span>{n.name}</span>{dev&&n.identifier&&<small>{n.identifier}</small>}</Button>;})}</div>:<CloudCanvas identity={String(uid||'guest')} nodes={visible} parentId="controls" scope="home" onOpen={(e,_id,to)=>{e.preventDefault();navigate(to);}} opening={null} loading={space.loading} showIdentifiers={dev} onCommand={n=>void command(n)} onHighlight={n=>openCloudControls(n,'home',location.pathname+location.search)}/>}
 {featureError&&!featureDialog&&<p role="alert">{featureError}</p>}
 <Dialog open={featureDialog} onOpenChange={open=>{if(!featureBusy)setFeatureDialog(open);}}><DialogContent closeDisabled={featureBusy}><DialogTitle>Remove from Home?</DialogTitle><DialogDescription>Find this feature and its contents in Hidden.</DialogDescription>{featureError&&<p role="alert">{featureError}</p>}<Button variant="ghost" disabled={featureBusy} onClick={()=>setFeatureDialog(false)}>Keep</Button><Button disabled={featureBusy} onClick={()=>void changeFeature()}>{featureBusy?'Removing…':'Delete'}</Button>{dev&&node?.canEdit&&<Button variant="ghost" disabled={featureBusy} onClick={()=>{setFeatureDialog(false);setMode('remove');}}>Delete for everyone</Button>}</DialogContent></Dialog>
 {space.error&&<div role="alert" className={styles.error}>{space.error}<Button variant="link" onClick={()=>void space.retry()}>Retry</Button></div>}
 {mode&&node&&!(touchMobile&&mode==='move')&&<CloudActions dev={dev} onEdit={async(name,color,note,photoMode,photos)=>await space.edit(node.id,name,color,note,photoMode,photos)&&done('Saved')} node={node} nodes={space.nodes} scope={source as CloudScope} version={space.version} mode={mode} count={cloudTree.descendants(space.nodes,node.id)} busy={space.busy} error={space.error} onClose={()=>{setMode(null);space.clearError();}} loadTarget={space.loadTarget} onRename={async(name,color)=>await space.rename(node.id,name,color)&&done('Saved')} onRemove={async (op,keepChildren)=>await space.remove(node.id,cloudTree.descendants(space.nodes,node.id),op,keepChildren)&&done('Deleted',new URL(origin,'https://ion.floot.app').searchParams.get('cloud')===node.id?cloudURL(node.parentId,source):origin)} onRelocate={async(parent,copy,op,targetScope,targetVersion)=>{if(touchMobile&&!copy)return false;const result=targetScope!==source?await space.transfer(node.id,targetScope as 'public'|'private',parent,targetVersion,copy,op):await space.relocate(node.id,parent,copy,op);return result&&done(copy?'Duplicated':'Moved');}}/>}
 {linking&&node&&<CloudLinkEditor node={node} scope={source} nodes={space.nodes} busy={space.busy} saveError={space.error} onClose={()=>{setLinking(false);space.clearError();}} loadTarget={space.loadTarget} onSave={async(target,words)=>await space.link(node.id,target,words)&&done('Redirect saved')}/>}
 {viewer&&node&&<CloudPhotoViewer node={node} onClose={()=>setViewer(false)}/>}
 <Dialog open={clipboard} onOpenChange={setClipboard}><DialogContent><DialogTitle>{copyingText?'Copy':'Copy IL'}</DialogTitle><DialogDescription>Select the text to copy it.</DialogDescription><Input aria-label={copyingText?'Text':'Identifier'} readOnly value={(copyingText?node?.name:node?.identifier)||''} onFocus={e=>e.currentTarget.select()}/><Button variant="ghost" onClick={()=>setClipboard(false)}>Done</Button></DialogContent></Dialog>
 </div>;
}
