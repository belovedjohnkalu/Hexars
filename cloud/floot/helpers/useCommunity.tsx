import {communityUndo} from './communityUndo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCommunity } from '../endpoints/community_GET.schema';
import { postCommunity, type CommunityInput, type CommunityResult } from '../endpoints/community_POST.schema';
import { communityPaging } from './communityPaging';
import { realtimeLease } from './realtimeLease';
import { channels } from './realtimeChannels';

export function useCommunity(roomId:string,topicId:string|null,cursor:string|null,userId:number|null,replyId:string|null=null) {
  const key=[roomId,topicId||'',cursor||'',userId||'guest',replyId||''].join(':'),active=useRef(key);active.current=key;
  const [state,setState]=useState<{key:string;data:CommunityResult;loading:boolean;error:string}>({key,data:{},loading:true,error:''});
  const [busy,setBusy]=useState(false),[following,setFollowing]=useState(false),[fresh,setFresh]=useState(false),locked=useRef(false),controller=useRef<AbortController|null>(null),sequence=useRef(0);
  const reload=useCallback(async()=>{
    controller.current?.abort();const abort=new AbortController();controller.current=abort;const own=++sequence.current;
    try {
      const data=topicId?await getCommunity({topicId,...(replyId?{replyId}:{}),...(cursor?{cursor}:{})},abort.signal):roomId==='chess-following'?userId?await postCommunity({action:'following',...(cursor?{cursor}:{})},abort.signal,userId):{topics:[],next:null}:await getCommunity({roomId,...(cursor?{cursor}:{})},abort.signal);
      if(active.current===key&&own===sequence.current&&!abort.signal.aborted){setState({key,data,loading:false,error:''});setFresh(false);}
    }catch(e){if(active.current===key&&own===sequence.current&&!abort.signal.aborted)setState(old=>({key,data:old.key===key?old.data:{},loading:false,error:e instanceof Error?e.message:'Couldn’t open Community.'}));}
  },[key,roomId,topicId,cursor,userId,replyId]);
  useEffect(()=>{
    setState({key,data:{},loading:true,error:''});setFollowing(false);setFresh(false);setBusy(false);locked.current=false;void reload();
    const abort=new AbortController();if(topicId&&userId)void postCommunity({action:'watch',topicId},abort.signal,userId).then(r=>{if(active.current===key&&!abort.signal.aborted)setFollowing(!!r.following);}).catch(()=>{});
    return()=>{controller.current?.abort();abort.abort();};
  },[key,reload,topicId,userId]);
  useEffect(()=>{
    if(roomId==='chess-following'&&!topicId)return;
    const client=realtimeLease(userId);let timer:ReturnType<typeof setTimeout>|undefined;
    const reconcile=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(document.visibilityState==='visible'&&document.documentElement.dataset.ionScreenActive!=='false')void reload();},250+Math.random()*750);};
    const off=client.subscribe(topicId?channels.chessTopic(topicId):channels.chessRoom(roomId),event=>{
      if(active.current!==key)return;
      if(cursor){setFresh(true);return;}
      setState(old=>{
        if(old.key!==key||old.loading)return old;
        if(topicId){
          if(event.kind!=='reply'&&event.removed===topicId)return{...old,data:{},error:'This discussion isn’t available.'};
          const replies=communityPaging.patchReplies(old.data.replies||[],event),last=replies[replies.length-1],overflow=event.reply&&!(old.data.replies||[]).some(r=>r.id===event.reply.id)&&(old.data.replies?.length??0)>=4;
          return{...old,data:{...old.data,...(event.topic?{topic:event.topic}:event.stats&&old.data.topic?{topic:{...old.data.topic,...event.stats}}:{}),replies,...(overflow&&last?{next:communityPaging.encode({date:last.createdAt,id:last.id})}:{})}};
        }
        const topics=communityPaging.patchTopics(old.data.topics||[],event),last=topics[topics.length-1],overflow=event.topic&&!(old.data.topics||[]).some(t=>t.id===event.topic.id)&&(old.data.topics?.length??0)>=5;
        return{...old,data:{...old.data,topics,...(overflow&&last?{next:communityPaging.encode({date:last.createdAt,id:last.id,pinned:last.pinned})}:{})}};
      });
    }),again=client.onReconnect(reconcile),status=client.onStatus(value=>{if(value==='connected')reconcile();});
    void client.connect();window.addEventListener('focus',reconcile);window.addEventListener('online',reconcile);
    return()=>{clearTimeout(timer);off();again();status();client.close();window.removeEventListener('focus',reconcile);window.removeEventListener('online',reconcile);};
  },[key,roomId,topicId,cursor,userId,reload]);
  async function execute(input:CommunityInput) {
    if(locked.current)return null;locked.current=true;setBusy(true);setState(old=>({...old,error:''}));const own=key;
    try {
      const data=await postCommunity(input,undefined,userId);
      if(active.current!==own)return null;
      if(data.undo&&userId)communityUndo.put(userId,data.undo);
      if(input.action==='restore'&&userId)communityUndo.clear(userId);
      if(typeof data.following==='boolean')setFollowing(data.following);
      setState(old=>{
        if(old.key!==key)return old;
        if(data.reply){const replies=communityPaging.patchReplies(old.data.replies||[],{reply:data.reply}),last=replies[replies.length-1];return{...old,data:{...old.data,...(data.topic?{topic:data.topic}:{}),replies,...((old.data.replies?.length??0)>=4&&last?{next:communityPaging.encode({date:last.createdAt,id:last.id})}:{})}};}
        return{...old,data:{...old.data,...(data.topic&&topicId?{topic:data.topic}:{})}};
      });
      return data;
    }catch(e){if(active.current===own)setState(old=>({...old,error:e instanceof Error?e.message:'Couldn’t save. Try again.'}));return null;}
    finally{if(active.current===own){locked.current=false;setBusy(false);}}
  }
  return{data:state.key===key?state.data:{},loading:state.key!==key||state.loading,error:state.key===key?state.error:'',busy,following,fresh,reload,execute};
}
