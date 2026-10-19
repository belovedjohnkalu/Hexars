import { useEffect,useState } from 'react';
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
 const [nodes,setNodes]=useState<CloudNode[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[undo,setUndo]=useState<LibraryUndo|undefined>();
 useEffect(()=>{if(!undo)return;const timer=setTimeout(()=>setUndo(undefined),Math.max(0,undo.expiresAt-Date.now()));return()=>clearTimeout(timer);},[undo]);
 useEffect(()=>{setNodes([]);if(!enabled||!userId)return;const controller=new AbortController();let sequence=0;setLoading(true);setError('');
  const load=async()=>{const own=++sequence;try{const out=await postHistory(Intl.DateTimeFormat().resolvedOptions().timeZone,controller.signal);if(!controller.signal.aborted&&own===sequence){setNodes(out.nodes||historyClouds(out.games,userId));setUndo(out.undo&&out.undo.expiresAt>Date.now()?out.undo:undefined);setError('');window.dispatchEvent(new CustomEvent('ion.library.changed'));}}catch(e){if(!controller.signal.aborted&&own===sequence)setError(e instanceof Error?e.message:'Couldn’t open Library.');}finally{if(!controller.signal.aborted&&own===sequence)setLoading(false);}};
  void(async()=>{const known=new Map<string,{gameId:string;accessToken:string}>();for(const variant of chessVariants.all)for(const mode of ['engine','two_players'] as const){const saved=gameSessions.stored(variant.id,mode);if(saved)known.set(saved.gameId,saved);}await Promise.allSettled([...known.values()].map(saved=>postGame({action:'get',...saved},{signal:controller.signal})));if(!controller.signal.aborted)await load();})();
  const client=new RealtimeClient(),off=client.subscribe(channels.player(userId),()=>void load()),again=client.onReconnect(()=>void load());void client.connect();
  return()=>{controller.abort();off();again();client.close();};
 },[userId,enabled]);return{nodes,loading,error,undo,restore:async()=>{if(!undo)return;try{await postLibrary({action:'restore',gameId:undo.gameId,shareId:undo.shareId,removedAt:undo.removedAt});setUndo(undefined);}catch(e){setError(e instanceof Error?e.message:'Couldn’t restore.');}}};
}
