import { useEffect,useRef,useState } from 'react';
import { realtimeLease } from './realtimeLease';
import { channels } from './realtimeChannels';
import { postMatchChat,type ChatWord } from '../endpoints/match_chat_POST.schema';
export function useMatchChat(gameId:string|undefined,userId:number|null,enabled:boolean){
 const [messages,setMessages]=useState<ChatWord[]>([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<{id:string;text:string}|null>(null),sending=useRef(false),current=useRef(gameId),controller=useRef<AbortController|null>(null);current.current=gameId;
 useEffect(()=>{setMessages([]);setDraft('');setError('');setBusy(false);pending.current=null;sending.current=false;return()=>controller.current?.abort();},[gameId,userId,enabled]);
 useEffect(()=>{
  if(!enabled||!gameId||!userId)return;
  const client=realtimeLease(userId);let alive=true;
  const off=client.subscribe(channels.player(userId),event=>{const word=event.chat as ChatWord|undefined;if(!alive||!word||word.gameId!==gameId||word.expiresAt<=Date.now())return;setMessages(old=>[...old.filter(m=>m.id!==word.id&&m.expiresAt>Date.now()),word]);});
  void client.connect();const timer=setInterval(()=>setMessages(old=>old.some(m=>m.expiresAt<=Date.now())?old.filter(m=>m.expiresAt>Date.now()):old),1000);
  return()=>{alive=false;clearInterval(timer);off();client.close();};
 },[gameId,userId,enabled]);
 async function send(){if(!gameId||!enabled||sending.current||!draft.trim())return;const id=gameId,item=pending.current?.text===draft.trim()?pending.current:{id:crypto.randomUUID(),text:draft.trim()};pending.current=item;sending.current=true;setBusy(true);setError('');const abort=new AbortController();controller.current=abort;
  try{const result=await postMatchChat({gameId:id,...item},abort.signal);if(current.current===id&&!abort.signal.aborted){setMessages(old=>[...old.filter(m=>m.id!==result.message.id&&m.expiresAt>Date.now()),result.message]);setDraft('');pending.current=null;}}
  catch(e){if(current.current===id&&!abort.signal.aborted)setError(e instanceof Error?e.message:'Message not sent. Try again.');}
  finally{if(current.current===id&&!abort.signal.aborted){sending.current=false;setBusy(false);}}
 }
 return {messages,draft,setDraft,busy,error,send};
}
