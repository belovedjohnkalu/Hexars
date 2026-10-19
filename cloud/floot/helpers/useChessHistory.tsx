import { useEffect,useState } from 'react';
import { postHistory } from '../endpoints/history_POST.schema';
import { postGame } from '../endpoints/game_POST.schema';
import { historyClouds } from './historyClouds';
import { gameSessions } from './gameSessions';
import { chessVariants } from './chessVariants';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export function useChessHistory(userId:number|null,enabled:boolean){const [nodes,setNodes]=useState<CloudNode[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');useEffect(()=>{setNodes([]);if(!enabled||!userId)return;const controller=new AbortController();setLoading(true);setError('');void(async()=>{
 // A valid saved capability may attach an older local game to this account.
 // Never infer ownership of anonymous games from their creation time.
 const known=new Map<string,{gameId:string;accessToken:string}>();for(const variant of chessVariants.all)for(const mode of ['engine','two_players'] as const){const saved=gameSessions.stored(variant.id,mode);if(saved)known.set(saved.gameId,saved);}
 await Promise.allSettled([...known.values()].map(saved=>postGame({action:'get',...saved},{signal:controller.signal})));
 const out=await postHistory(Intl.DateTimeFormat().resolvedOptions().timeZone,controller.signal);if(!controller.signal.aborted)setNodes(historyClouds(out.games));})().catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Couldn’t open History.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[userId,enabled]);return{nodes,loading,error};}
