import { useCallback,useEffect,useRef,useState } from 'react';
import {postLibrary,type LibraryUndo} from '../endpoints/library_POST.schema';
import { postHistory } from '../endpoints/history_POST.schema';
import { postGame } from '../endpoints/game_POST.schema';
import { historyClouds } from './historyClouds';
import { gameSessions } from './gameSessions';
import { chessVariants } from './chessVariants';
import { RealtimeClient } from './RealtimeClient';
import { channels } from './realtimeChannels';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export function useChessHistory(userId:number|null,enabled:boolean){
 const identity=enabled&&userId?String(userId):null,activeIdentity=useRef(identity);activeIdentity.current=identity;
 const [loadedIdentity,setLoadedIdentity]=useState(identity),[nodes,setNodes]=useState<CloudNode[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[undo,setUndo]=useState<LibraryUndo|undefined>();
 const reload=useRef<()=>Promise<void>>(async()=>{}),restoreController=useRef<AbortController|null>(null),retry=useCallback(()=>reload.current(),[]);
 useEffect(()=>{if(!undo)return;const timer=setTimeout(()=>setUndo(undefined),Math.max(0,undo.expiresAt-Date.now()));return()=>clearTimeout(timer);},[undo]);
 useEffect(()=>{
  setLoadedIdentity(identity);setNodes([]);setError('');setUndo(undefined);setLoading(!!identity);
  if(!enabled||!userId)return;
  const controller=new AbortController();let sequence=0;
  const current=()=>!controller.signal.aborted&&activeIdentity.current===identity;
  const load=async(showLoading=false)=>{
   if(!current())return;const own=++sequence;if(showLoading)setLoading(true);setError('');
   try{const out=await postHistory(Intl.DateTimeFormat().resolvedOptions().timeZone,controller.signal);if(current()&&own===sequence){setNodes(out.nodes||historyClouds(out.games,userId));setUndo(out.undo&&out.undo.expiresAt>Date.now()?out.undo:undefined);setError('');window.dispatchEvent(new window.CustomEvent('ion.library.changed'));}}
   catch(e){if(current()&&own===sequence)setError(e instanceof Error?e.message:'Couldn’t open Library.');}
   finally{if(current()&&own===sequence)setLoading(false);}
  };
  reload.current=()=>load(true);
  void(async()=>{const known=new Map<string,{gameId:string;accessToken:string}>();for(const variant of chessVariants.all)for(const mode of ['engine','two_players'] as const){const saved=gameSessions.stored(variant.id,mode);if(saved)known.set(saved.gameId,saved);}await Promise.allSettled([...known.values()].map(saved=>postGame({action:'get',...saved},{signal:controller.signal})));if(current())await load();})();
  const client=new RealtimeClient(),off=client.subscribe(channels.player(userId),()=>void load()),again=client.onReconnect(()=>void load());void client.connect();
  return()=>{controller.abort();restoreController.current?.abort();reload.current=async()=>{};off();again();client.close();};
 },[userId,enabled,identity]);
 const matches=identity!==null&&loadedIdentity===identity,visibleUndo=matches?undo:undefined;
 return{nodes:matches?nodes:[],loading:identity!==null&&(!matches||loading),error:matches?error:'',undo:visibleUndo,retry,restore:async()=>{
  if(!visibleUndo)return;const own=identity,controller=new AbortController();restoreController.current?.abort();restoreController.current=controller;
  try{await postLibrary({action:'restore',gameId:visibleUndo.gameId,shareId:visibleUndo.shareId,removedAt:visibleUndo.removedAt},controller.signal);if(!controller.signal.aborted&&activeIdentity.current===own)setUndo(undefined);}
  catch(e){if(!controller.signal.aborted&&activeIdentity.current===own)setError(e instanceof Error?e.message:'Couldn’t restore.');}
 }};
}
