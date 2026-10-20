import { useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postLibrary } from '../endpoints/library_POST.schema';
import { CloudCanvas } from './CloudCanvas';
import { LoadingScreen } from './LoadingScreen';
import { Button } from './Button';
import { Input } from './Input';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { savedReturn } from './SavedGame';
import styles from './CloudControls.module.css';
export function SavedGameControls({onFeedback}:{onFeedback:(text:string)=>void}){
 const location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),gameId=params.get('game')||undefined,shareId=params.get('shareId')||undefined,token=params.get('token')||undefined,notation=params.get('notation'),origin=savedReturn(params.get('origin'));
 const {data,error,isPending}=useQuery({queryKey:['saved-controls',gameId,shareId,token],queryFn:({signal})=>postLibrary({action:'get',gameId,shareId,token,nodeId:params.get('selected')||undefined},signal),retry:1});
 const [dialog,setDialog]=useState<'delete'|'share'|'share-nickname'|'copy'|null>(params.get('shareMode')==='nickname'?'share-nickname':null),[busy,setBusy]=useState(false),[nickname,setNickname]=useState(''),[message,setMessage]=useState(''),[link,setLink]=useState(''),[copy,setCopy]=useState('');
 async function copyText(text:string){try{await navigator.clipboard.writeText(text);onFeedback('Copied');}catch{setCopy(text);setDialog('copy');}}
 const nodes:CloudNode[]=notation?[{id:'saved-copy-notation',parentId:'saved-controls',name:'Copy',color:'cyan',destination:'control',control:'copy'}]:[
 ...(data?.canRemove?[{id:'saved-delete',parentId:'saved-controls',name:'Delete',color:'coral',destination:'control',control:'remove'} as CloudNode]:[]),
 ...(data?.canShare?[{id:'saved-share',parentId:'saved-controls',name:'Share',color:'cyan',destination:'control',control:'copy'} as CloudNode]:[]),
 ...(data?.canShare?[{id:'saved-share-nickname',parentId:'saved-controls',name:'Send to player',color:'mint',destination:'control',control:'copy'} as CloudNode]:[]),
 ...(data?.dev&&data.identifier?[{id:'saved-copy-il',parentId:'saved-controls',name:'Copy IL',color:'lavender',destination:'control',control:'copy-il'} as CloudNode]:[])
 ];
 async function share(toAccount:boolean){if(!data||busy)return;setBusy(true);setMessage('');try{const result=await postLibrary<{path:string}>({action:'share',gameId:data.gameId,...(toAccount?{recipientNickname:nickname}:{})});if(toAccount){navigate(origin,{state:{restoreCamera:true,notice:'Shared'}});}else{setLink(new URL(result.path,'https://ion.floot.app').href);}}catch(e){setMessage(e instanceof Error?e.message:'Couldn’t share.');}finally{setBusy(false);}}
 return <div className={styles.page}>{isPending?<LoadingScreen label="Opening game controls"/>:error?<p role="alert">{error.message}</p>:<CloudCanvas identity="saved-controls" nodes={nodes} parentId="saved-controls" scope="home" opening={null} loading={false} onOpen={(e)=>e.preventDefault()} onCommand={node=>{setMessage('');if(node.id==='saved-copy-notation')void copyText(notation!);else if(node.id==='saved-copy-il')void copyText(data!.identifier!);else setDialog(node.id==='saved-delete'?'delete':node.id==='saved-share-nickname'?'share-nickname':'share');}}/>}
 <Dialog open={dialog!==null} onOpenChange={open=>{if(!open&&!busy){setDialog(null);setMessage('');}}}><DialogContent closeDisabled={busy}><DialogTitle>{dialog==='delete'?(data?.shareRole==='sender'?'Stop sharing?':'Delete saved game?'):dialog==='share'||dialog==='share-nickname'?'Share game':'Copy'}</DialogTitle><DialogDescription>{dialog==='delete'?(data?.shareRole==='sender'?'The shared link will stop working.':data?.shareRole==='recipient'?'This removes it from Received.':'This removes it from your Library. Other players keep their game.'):dialog==='share'||dialog==='share-nickname'?'Send a view-only game using a player name.':'Select the text to copy it.'}</DialogDescription>
 {dialog==='delete'?<><Button variant="ghost" disabled={busy} onClick={()=>setDialog(null)}>Keep game</Button><Button variant="destructive" disabled={busy} onClick={async()=>{if(busy)return;setBusy(true);try{await postLibrary({action:'remove',...(shareId?{shareId}:{gameId})});navigate(shareId?origin:'/?cloud=game-history',{state:{restoreCamera:true,notice:'Deleted'}});}catch(e){setMessage(e instanceof Error?e.message:'Couldn’t delete.');}finally{setBusy(false);}}}>{busy?'Deleting…':'Delete'}</Button></>:dialog==='share'||dialog==='share-nickname'?<>
 {link?<><Input aria-label="Shared game link" readOnly value={link} onFocus={e=>e.currentTarget.select()}/><Button variant="ghost" onClick={()=>void copyText(link)}>Copy link</Button><Button variant="ghost" onClick={()=>navigate(origin,{state:{restoreCamera:true}})}>Done</Button></>:<>{dialog==='share'&&<Button disabled={busy} onClick={()=>void share(false)}>{busy?'Sharing…':'Create link'}</Button>}<form noValidate onSubmit={e=>{e.preventDefault();void share(true);}}><Input aria-label="Recipient player name" autoComplete="off" placeholder="Player name" maxLength={40} value={nickname} readOnly={busy} onChange={e=>setNickname(e.target.value)}/><Button type="submit" disabled={busy||!nickname.trim()}>Send to account</Button></form></>}
 </>:<Input aria-label="Text to copy" readOnly value={copy.replace(/\n/g,' · ')} onFocus={e=>e.currentTarget.select()}/>}
 {message&&<p role="alert">{message}</p>}
 </DialogContent></Dialog></div>;
}
