import {useCallback,useEffect,useRef,useState} from 'react';
import {postPuzzle,type PuzzleView,type PuzzleResult} from '../endpoints/puzzles_POST.schema';
import type {VariantId,ChessMove} from '../endpoints/game_POST.schema';
import {deviceData} from './deviceData';
import {realtimeLease} from './realtimeLease';
import {channels} from './realtimeChannels';
export function useDailyPuzzle(variant:VariantId,userId:number|null){
 const key=variant+':'+(userId??'guest'),active=useRef(key);active.current=key;
 const [state,setState]=useState<{key:string;puzzle:PuzzleView|null;loading:boolean;error:string}>({key,puzzle:null,loading:true,error:''}),[busy,setBusy]=useState(false);
 const current=useRef<PuzzleView|null>(null);current.current=state.key===key?state.puzzle:null;
 const controller=useRef<AbortController|null>(null),request=useRef<AbortController|null>(null),locked=useRef(false),sequence=useRef(0),pending=useRef<{key:string;id:string}|null>(null);
 const reload=useCallback(async()=>{
  controller.current?.abort();const abort=new AbortController();controller.current=abort;const own=++sequence.current;
  try{
   const result=await postPuzzle({action:'load',variant,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone},abort.signal,userId);let puzzle=result.puzzle!;
   if(!userId){const saved=await deviceData.get<Pick<PuzzleView,'progress'|'after'|'move'>>('guest','puzzle:'+puzzle.id);if(saved?.progress&&Number.isSafeInteger(saved.progress.version))puzzle={...puzzle,...saved};}
   if(active.current===key&&own===sequence.current&&!abort.signal.aborted)setState({key,puzzle,loading:false,error:''});
  }catch(e){if(active.current===key&&!abort.signal.aborted)setState(old=>({key,puzzle:old.key===key?old.puzzle:null,loading:false,error:e instanceof Error?e.message:'Couldn’t open the puzzle.'}));}
 },[key,variant,userId]);
 useEffect(()=>{setState({key,puzzle:null,loading:true,error:''});setBusy(false);locked.current=false;pending.current=null;void reload();return()=>{controller.current?.abort();request.current?.abort();};},[key,reload]);
 useEffect(()=>{
  const expires=state.puzzle?.expiresAt,remaining=expires?Date.parse(expires)-Date.now():0;
  const timer=expires?setTimeout(()=>{if(document.visibilityState==='visible')void reload();},Math.max(1000,Math.min(2147483647,remaining+Math.random()*500))):undefined;
  const focus=()=>{if(document.visibilityState==='visible')void reload();};window.addEventListener('focus',focus);window.addEventListener('online',focus);document.addEventListener('visibilitychange',focus);
  return()=>{clearTimeout(timer);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);document.removeEventListener('visibilitychange',focus);};
 },[state.puzzle?.expiresAt,reload]);
 useEffect(()=>{
  if(!userId)return;const client=realtimeLease(userId),off=client.subscribe(channels.player(userId),event=>{if(!locked.current&&event.puzzleId===current.current?.id&&event.version>(current.current?.progress.version??0))void reload();}),again=client.onReconnect(()=>void reload());void client.connect();return()=>{off();again();client.close();};
 },[userId,reload]);
 async function execute(action:'hint'|'attempt',move?:ChessMove):Promise<PuzzleResult|null>{
  const puzzle=current.current;if(!puzzle||locked.current)return null;locked.current=true;setBusy(true);setState(old=>({...old,error:''}));const own=key,abort=new AbortController();request.current=abort;
  const payload={variant,puzzleId:puzzle.id,timeZone:puzzle.timeZone,version:puzzle.progress.version},signature=JSON.stringify([puzzle.id,payload.version,action,move]);
  if(pending.current?.key!==signature)pending.current={key:signature,id:crypto.randomUUID()};
  try{
   const result=await postPuzzle(action==='hint'?{...payload,action,requestId:pending.current.id}:{...payload,action,move:move!,requestId:pending.current.id},abort.signal,userId);
   if(active.current!==own||abort.signal.aborted)return null;
   let progress=result.progress!;
   if(!userId)progress={...progress,attempts:puzzle.progress.attempts+(action==='attempt'?1:0),hintUsed:puzzle.progress.hintUsed||action==='hint',solved:puzzle.progress.solved||!!result.correct};
   const next={...puzzle,progress,...(result.after?{after:result.after,move:result.move}:{})};pending.current=null;setState({key,puzzle:next,loading:false,error:''});
   if(!userId)void deviceData.put('guest','puzzle:'+puzzle.id,{progress,after:next.after,move:next.move}).catch(()=>{});
   return{...result,progress};
  }catch(e){if(active.current===own&&!abort.signal.aborted){setState(old=>({...old,error:e instanceof Error?e.message:'Your move wasn’t sent. Try again.'}));if(e&&typeof e==='object'&&'code'in e&&['STALE_PUZZLE','PUZZLE_CONFLICT'].includes(String(e.code)))void reload();if(e&&typeof e==='object'&&'status'in e&&e.status===401)window.dispatchEvent(new Event('ion.session-expired'));}return null;}
  finally{if(active.current===own){locked.current=false;setBusy(false);}}
 }
 return{puzzle:state.key===key?state.puzzle:null,loading:state.key!==key||state.loading,error:state.key===key?state.error:'',busy,reload,attempt:(move:ChessMove)=>execute('attempt',move),hint:()=>execute('hint')};
}
