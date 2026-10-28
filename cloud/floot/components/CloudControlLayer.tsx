import {useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {toast} from 'sonner';
import {useAuth} from '../helpers/useAuth';
import {useCloudSpace} from '../helpers/useCloudSpace';
import type {CloudControlRequest} from '../helpers/cloudControlPopup';
import {CloudControls} from './CloudControls';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './Dialog';
import {Button} from './Button';
import styles from './CloudControlLayer.module.css';

export function CloudControlLayer(){
 const location=useLocation(),{authState}=useAuth(),uid=authState.type==='authenticated'?authState.user.id:null,[request,setRequest]=useState<CloudControlRequest|null>(null);
 useEffect(()=>{const open=(event:Event)=>{const value=(event as CustomEvent<CloudControlRequest>).detail;if(value&&typeof value.id==='string'&&['home','public','private','chess','accounts','schedule'].includes(value.source))setRequest(value);};window.addEventListener('ion.cloud-controls',open);return()=>window.removeEventListener('ion.cloud-controls',open);},[]);
 useEffect(()=>setRequest(null),[location.key,uid]);
 return request?<ControlPanel key={request.id+':'+request.source+':'+(request.game||'')} request={request} uid={uid} authLoading={authState.type==='loading'} onClose={()=>setRequest(null)}/>:null;
}

function ControlPanel({request,uid,authLoading,onClose}:{request:CloudControlRequest;uid:number|null;authLoading:boolean;onClose:()=>void}){
 const home=useCloudSpace(uid,authLoading,'home');
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className={styles.panel} onCloseAutoFocus={event=>{event.preventDefault();const target=document.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(request.id)+'"]')||document.getElementById('cloud-title');target?.focus({preventScroll:true});}}>
  <DialogTitle className={styles.title}>Controls</DialogTitle><DialogDescription className={styles.description}>Choose an action.</DialogDescription>
  {!request.game&&!home.ready&&home.error?<div className={styles.error} role="alert"><span>{home.error}</span><Button variant="ghost" onClick={()=>void home.retry()}>Retry</Button></div>:<CloudControls nodes={home.nodes} selection={request} compact onDismiss={onClose} onFeedback={message=>toast(message)}/>}
 </DialogContent></Dialog>;
}
