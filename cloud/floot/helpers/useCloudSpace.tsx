import {deviceData} from './deviceData';
import {useCloudOutbox} from './useCloudOutbox';
import {cloudOutbox} from './cloudOutbox';
import {transientFailure} from './cacheRead';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postCloud,type CloudScope,type InputType,type OutputType } from "../endpoints/cloud_POST.schema";
import { cloudTree } from "./cloudTree";
import { RealtimeClient } from "./RealtimeClient";
import { channels } from "./realtimeChannels";
type Credentials={workspaceId:string;accessToken:string;functionalId?:string};
import type { CloudColor } from "./cloudColors";
import {mapPhotos,type CloudPhotoDraft,type PhotoType} from './cloudPhotos';
type NewNode={id:string;photos?:CloudPhotoDraft[];name:string;parentId:string|null;file?:File;uploaded?:boolean;color?:CloudColor};
type Change=Extract<InputType,{action:'update'|'rename'|'remove'|'restore'|'move'|'copy'|'transfer'|'link'}>;
const blank=(scope:CloudScope):OutputType=>({nodes:cloudTree.forScope(scope).map(({note,...node})=>node),version:0,scope,canAdd:false});
const failureMessage=(e:unknown)=>e instanceof Error&&!(e instanceof TypeError)&&!(e instanceof SyntaxError)?e.message:'Couldn’t save. Check your connection and try again.';
function credentials():Credentials{
 try{const saved=JSON.parse(localStorage.getItem('ion.private-space.v1')||'null');if(saved&&/^[a-f0-9-]{36}$/.test(saved.workspaceId)&&/^[a-f0-9]{64}$/.test(saved.accessToken))return saved;
 const bytes=crypto.getRandomValues(new Uint8Array(32)),value={workspaceId:crypto.randomUUID(),accessToken:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')};localStorage.setItem('ion.private-space.v1',JSON.stringify(value));return value;
 }catch{return {workspaceId:crypto.randomUUID(),accessToken:'0'.repeat(64)};}
}
export function useCloudSpace(accountId:number|null=null,authLoading=false,scope:CloudScope='private',functionalId?:string){
 const outbox=useCloudOutbox(accountId,scope),[offline,setOffline]=useState(false);
 const [data,setData]=useState<OutputType>(()=>blank(scope)),[loading,setLoading]=useState(true),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[phase,setPhase]=useState<'idle'|'uploading'|'saving'>('idle');
 const identity=useRef<Credentials|null>(null),current=useRef(data),scopeKey=useRef(''),loadSequence=useRef(0),mounted=useRef(true),locked=useRef(false),uploadController=useRef<AbortController|null>(null);
 const accept=useCallback((value:OutputType)=>{if(value.scope&&scopeKey.current!==value.scope+':'+(value.userId||'guest'))return;if(value.workspaceId===current.current.workspaceId&&value.version<current.current.version)return;current.current=value;if(mounted.current)setData(value);},[]);
 // Apply successful edits to every mounted view of this account and space.
 useEffect(()=>{const changed=(event:Event)=>{const value=(event as CustomEvent<OutputType>).detail;if(value.scope===scope&&(value.userId||null)===accountId)accept(value);};window.addEventListener('ion.cloud-saved',changed);return()=>window.removeEventListener('ion.cloud-saved',changed);},[scope,accountId,accept]);
 const saved=(value:OutputType)=>{accept(value);void deviceData.put(String(accountId||'guest'),'cloud:'+scope,value);window.dispatchEvent(new window.CustomEvent('ion.cloud-saved',{detail:value}));};
 const [undoClock,setUndoClock]=useState(Date.now());
 useEffect(()=>{const deadline=data.undo?.expiresAt;if(!deadline)return;setUndoClock(Date.now());const t=setTimeout(()=>setUndoClock(Date.now()),Math.max(0,deadline-Date.now())+10);return()=>clearTimeout(t);},[data.undo?.operationId,data.undo?.expiresAt]);
 const load=useCallback(async(signal?:AbortSignal)=>{
  const next=scope+':'+(accountId||'guest'),sequence=++loadSequence.current,active=()=>mounted.current&&!signal?.aborted&&scopeKey.current===next&&sequence===loadSequence.current;
  try{if(scopeKey.current!==next){scopeKey.current=next;current.current=blank(scope);setData(current.current);setReady(false);setLoading(true);}identity.current={...credentials(),...(functionalId?{functionalId}:{})};
   if((scope==='private'||scope==='schedule')&&!accountId){accept(blank(scope));setReady(true);setError('');return;}
   const cached=await deviceData.get<OutputType>(String(accountId||'guest'),'cloud:'+scope);if(active()&&cached&&(cached.userId||null)===accountId){accept(cached);setReady(true);setLoading(false);}
   let connect=false;try{connect=scope==='private'&&!!accountId&&sessionStorage.getItem('ion.connect-space')==='yes';}catch{}
   const value=await postCloud({action:'load',scope,...(accountId?{expectedUserId:accountId}:{}),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,account:!!accountId,...identity.current,connect},{signal});
   if(active()){accept(value);setOffline(false);void deviceData.put(String(accountId||'guest'),'cloud:'+scope,value);if(connect)sessionStorage.removeItem('ion.connect-space');setReady(true);setError('');}
  }catch(e){if(active()){const cached=await deviceData.get<OutputType>(String(accountId||'guest'),'cloud:'+scope);if(cached&&(cached.userId||null)===accountId&&transientFailure(e)){accept(cached);setReady(true);setOffline(true);setError('');}else setError(failureMessage(e));}}finally{if(active())setLoading(false);}
 },[accountId,scope,accept,functionalId]);
 useEffect(()=>{mounted.current=true;if(authLoading)return;const controller=new AbortController();void load(controller.signal);const refresh=()=>{if(document.documentElement.dataset.ionScreenActive!=='false'&&document.visibilityState==='visible'&&!locked.current)void load(controller.signal);};window.addEventListener('focus',refresh);window.addEventListener('online',refresh);window.addEventListener('ion.screen-visibility',refresh);if(scope==='home')window.addEventListener('ion.home-changed',refresh);document.addEventListener('visibilitychange',refresh);return()=>{mounted.current=false;controller.abort();window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);window.removeEventListener('ion.screen-visibility',refresh);window.removeEventListener('ion.home-changed',refresh);document.removeEventListener('visibilitychange',refresh);};},[load,authLoading]);
 useEffect(()=>{if(authLoading||((scope==='private'||scope==='accounts'||scope==='schedule')&&!accountId))return;const client=new RealtimeClient();let timer:ReturnType<typeof setTimeout>|undefined;const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(locked.current)refresh();else void load();},250);};const subscriptions=(scope==='home'?[channels.cloud('home',0),channels.cloud('public',0),channels.cloud('chess',0),channels.timeCatalog,...(accountId?[channels.time(accountId)]:[]),...(accountId?[channels.cloud('private',accountId),channels.cloud('accounts',accountId)]:[])]:[channels.cloud(scope,accountId||0),...(scope==='schedule'?[channels.cloud('home',0)]:[]),...(scope==='accounts'&&data.dev?[channels.timeCatalog]:[]),...(scope==='chess'?[channels.timeCatalog,...(accountId?[channels.time(accountId)]:[])]:[])]).map(channel=>client.subscribe(channel,refresh));const off=()=>subscriptions.forEach(unsubscribe=>unsubscribe()),again=client.onReconnect(refresh);void client.connect();return()=>{clearTimeout(timer);off();again();client.close();};},[scope,accountId,authLoading,load,data.dev]);
 // Expiry has no sign-out event. Reconcile only visible dev Accounts pages.
 useEffect(()=>{if(scope!=='accounts'||!data.dev||authLoading)return;const controller=new AbortController();const timer=setInterval(()=>{if(document.documentElement.dataset.ionScreenActive!=='false'&&document.visibilityState==='visible'&&!locked.current)void load(controller.signal);},5000);return()=>{clearInterval(timer);controller.abort();};},[scope,accountId,authLoading,data.dev,load]);
 async function mutate(body:NewNode|Record<string,unknown>,kind:'add'|'change'){
  if(!identity.current||!ready||locked.current||scopeKey.current!==scope+':'+(accountId||'guest'))return false;locked.current=true;setBusy(true);setError('');
  try{if(kind==='add'){
   const item=body as NewNode,imageType=(item.photos?.length?undefined:item.file?.type) as 'image/png'|'image/jpeg'|'image/webp'|'image/gif'|undefined;
   if(item.photos?.length){
    setPhase('uploading');const controller=new AbortController();uploadController.current=controller;
    await mapPhotos(item.photos,async photo=>{if(photo.uploadedFor===item.id)return;const prepared=await postCloud({action:'upload',scope,...identity.current!,...(accountId?{expectedUserId:accountId}:{}),id:item.id,fileId:photo.id,contentType:photo.file.type as PhotoType,sizeBytes:photo.file.size},{signal:controller.signal});if(!prepared.upload)throw new Error('Couldn’t prepare the picture.');const response=await fetch(prepared.upload.url,{method:'PUT',headers:prepared.upload.headers,body:photo.file,signal:controller.signal});if(!response.ok)throw new Error('Couldn’t upload the picture.');photo.uploadedFor=item.id;});
    uploadController.current=null;
   }
   if(!item.photos?.length&&item.file&&!item.uploaded){setPhase('uploading');const controller=new AbortController();uploadController.current=controller;const prepared=await postCloud({action:'upload',scope,...identity.current,...(accountId?{expectedUserId:accountId}:{}),id:item.id,contentType:imageType!,sizeBytes:item.file.size},{signal:controller.signal});if(!prepared.upload)throw new Error('Couldn’t prepare the picture.');const response=await fetch(prepared.upload.url,{method:'PUT',headers:prepared.upload.headers,body:item.file,signal:controller.signal});if(!response.ok)throw new Error('Couldn’t upload the picture.');item.uploaded=true;uploadController.current=null;}
   setPhase('saving');const request=()=>postCloud({action:'add',scope,...identity.current!,...(accountId?{expectedUserId:accountId}:{}),id:item.id,name:item.name,parentId:item.parentId,color:item.color,version:current.current.version,...(item.photos?.length?{images:item.photos.map(photo=>({id:photo.id,contentType:photo.file.type as PhotoType}))}:imageType?{imageType}:{})});let value:OutputType;try{value=await request();}catch(e){if(!(e&&typeof e==='object'&&'status'in e&&e.status===409))throw e;await load();value=await request();}saved(value);
  }else{setPhase('saving');saved(await postCloud({...body,scope,...identity.current,...(accountId?{expectedUserId:accountId}:{}),version:current.current.version} as Change));}return true;
  }catch(e){if(e&&typeof e==='object'&&'status'in e&&e.status===409)await load();if(mounted.current)setError(e instanceof Error&&e.name==='AbortError'?'':failureMessage(e));return false;}
  finally{locked.current=false;uploadController.current=null;if(mounted.current){setBusy(false);setPhase('idle');}}
 }
 const matches=scopeKey.current===scope+':'+(accountId||'guest'),visibleData=matches?data:blank(scope),serverIds=new Set(visibleData.nodes.map(n=>n.id)),pendingNodes=matches?outbox.nodes.filter(n=>!serverIds.has(n.id)):[];
 const mergedNodes=useMemo(()=>[...visibleData.nodes,...pendingNodes],[visibleData.nodes,outbox.nodes,matches]);
 const add=async(node:NewNode)=>{if(!accountId||deviceData.identity()!==String(accountId))return mutate(node,'add');if(!ready||!visibleData.canAdd)return false;try{setError('');return await cloudOutbox.enqueue(accountId,scope,node);}catch(e){setError(failureMessage(e));return false;}};
 return {...visibleData,nodes:mergedNodes,offline,publishing:pendingNodes.length>0,pendingJobs:outbox.jobs,retryPending:outbox.retry,discardPending:outbox.discard,undo:matches&&data.undo&&(!data.undo.expiresAt||data.undo.expiresAt>undoClock)?data.undo:undefined,loading:!matches||loading,ready:matches&&ready,busy,error,phase,add,rename:(id:string,name:string,color?:CloudColor)=>mutate({action:'rename',id,name,color},'change'),remove:(id:string,expectedCount:number,operationId:string,keepChildren=false)=>mutate({action:'remove',id,expectedCount,operationId,keepChildren},'change'),restore:(operationId:string)=>mutate({action:'restore',operationId},'change'),
  edit:async(id:string,name:string,color:CloudColor|undefined,note:string|undefined,photoMode:'keep'|'replace'|'remove',photos:CloudPhotoDraft[])=>{
   if(!identity.current||locked.current)return false;
   const assetId=crypto.randomUUID();
   try{if(photoMode==='replace')await mapPhotos(photos,async photo=>{const contentType=photo.file.type as PhotoType,prepared=await postCloud({action:'upload',scope,...identity.current!,...(accountId?{expectedUserId:accountId}:{}),id:assetId,fileId:photo.id,contentType,sizeBytes:photo.file.size});if(!prepared.upload)throw new Error('Couldn’t prepare the picture.');const result=await fetch(prepared.upload.url,{method:'PUT',headers:prepared.upload.headers,body:photo.file});if(!result.ok)throw new Error('Couldn’t upload the picture.');});
    return mutate({action:'update',id,name,color,...(note!==undefined?{note}:{}),photoMode,...(photoMode==='replace'?{assetId,images:photos.map(p=>({id:p.id,contentType:p.file.type as PhotoType}))}:{})},'change');
   }catch(e){setError(failureMessage(e));return false;}
  },
  link:(id:string,target:import('./cloudLinks').CloudRedirect|null,words?:number[])=>mutate({action:'link',id,target,words},'change'),
  relocate:(id:string,parentId:string|null,copy:boolean,operationId:string)=>mutate({action:copy?'copy':'move',id,parentId,operationId},'change'),
  transfer:(id:string,targetScope:'public'|'private',targetParent:string,targetVersion:number,copy:boolean,operationId:string)=>mutate({action:'transfer',id,targetScope,targetParent,targetVersion,mode:copy?'copy':'move',operationId},'change'),
  loadTarget:(targetScope:CloudScope)=>postCloud({action:'load',scope:targetScope,...(accountId?{expectedUserId:accountId}:{}),...(identity.current||credentials())}),
  cancelUpload:()=>uploadController.current?.abort(),retry:load,clearError:()=>setError('')};
}
