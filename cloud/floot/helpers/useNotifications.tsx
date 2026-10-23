import { createContext,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { postPush } from '../endpoints/push_POST.schema';
import { enablePush,disablePush,getPushIdentity,listenToPush,onPushEnabledChange,type PushMessagePayload,type NotificationClickEvent } from './pushClient';
import { notificationRoute,pushAccountKey } from './notificationRoutes';
const Context=createContext({enabled:false,busy:false,toggle:async()=>{}});
export function NotificationProvider({children}:{children:ReactNode}){
 const {authState}=useAuth(),uid=authState.type==='authenticated'?authState.user.id:null,identity=useRef(uid),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),locked=useRef(false),revision=useRef(0),navigate=useNavigate();identity.current=uid;
 useEffect(()=>{let alive=true;const generation=++revision.current;setEnabled(false);if(uid)void getPushIdentity().then(async value=>{if(!value)return;const result=await postPush({action:'status',accountId:uid,identity:value});if(alive&&generation===revision.current&&identity.current===uid&&!locked.current)setEnabled(result.enabled===true);}).catch(()=>{});const off=onPushEnabledChange(value=>{let same=false;try{same=localStorage.getItem(pushAccountKey)===String(identity.current);}catch{}setEnabled(value&&same&&!!identity.current);});return()=>{alive=false;off();};},[uid]);
 useEffect(()=>{
  if(authState.type==='loading')return;
  const receive=(event:Event)=>{const payload=(event as CustomEvent<PushMessagePayload>).detail;if(!payload.title||payload.data?.userId!==identity.current)return;const route=notificationRoute(payload.data||{});toast(payload.title,{description:payload.body,...(route?{action:{label:'Open',onClick:()=>navigate(route)}}:{})});};
  const click=(event:Event)=>{const payload=(event as CustomEvent<NotificationClickEvent>).detail;if(payload.data?.userId!==identity.current)return;const route=notificationRoute(payload.data);if(route)navigate(route);};
  window.addEventListener('ion.push-message',receive);window.addEventListener('ion.push-click',click);const off=listenToPush();
  return()=>{off();window.removeEventListener('ion.push-message',receive);window.removeEventListener('ion.push-click',click);};
 },[navigate,uid,authState.type]);
 async function toggle(){if(locked.current)return;if(!uid){navigate('/login?mode=signin');return;}locked.current=true;++revision.current;setBusy(true);const account=uid;try{
  if(enabled)await disablePush();else{localStorage.setItem(pushAccountKey,String(account));await enablePush();if(identity.current===account){const value=await getPushIdentity();const state=value?await postPush({action:'status',accountId:account,identity:value}):{enabled:false};if(!state.enabled)toast('Notifications are off',{description:'Allow notifications for ION. On iPhone, open the installed app from your Home Screen.'});}}
 }catch{if(identity.current===account){setEnabled(enabled);toast('Couldn’t update notifications',{description:'Check notification access, then try again.'});}}
 finally{locked.current=false;setBusy(false);}}
 return <Context.Provider value={{enabled,busy,toggle}}>{children}</Context.Provider>;
}
export function useNotifications(){return useContext(Context);}
