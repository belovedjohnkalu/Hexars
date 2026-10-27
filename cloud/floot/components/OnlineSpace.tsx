import { useEffect,useRef,useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import { Spinner } from './Spinner';
import { postOnline,type Lobby } from '../endpoints/online_POST.schema';
import { useAuth } from '../helpers/useAuth';
import { realtimeLease } from '../helpers/realtimeLease';
import { channels } from '../helpers/realtimeChannels';
import { chessVariants } from '../helpers/chessVariants';
import styles from './OnlineSpace.module.css';
export function OnlineSpace({join=false}:{join?:boolean}){
 const {authState}=useAuth(),location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),userId=authState.type==='authenticated'?authState.user.id:null;
 const [attempt,setAttempt]=useState(0),[lobby,setLobby]=useState<Lobby|null>(null),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),current=useRef<Lobby|null>(null),started=useRef(''),retry=useRef<(()=>void)|null>(null);
 const inputVariant=params.get('variant'),variant=chessVariants.isId(inputVariant)?inputVariant:'random',kind=params.get('kind')==='create'?'create':'find',savedId=params.get('room');
 function accept(value:Lobby){current.current=value;setLobby(value);if(value.status==='playing'&&value.gameId)navigate('/'+value.variant+'?mode=online#game='+value.gameId+'&key='+'0'.repeat(64),{replace:true});}
 useEffect(()=>{if(!userId||join)return;const key=userId+':'+location.search+':'+attempt;if(started.current===key)return;started.current=key;let alive=true,refreshing=false,refreshAgain=false;const client=realtimeLease(userId),controller=new AbortController();
  // A new lobby/account must not refresh the previous lobby while it opens.
  current.current=null;setLobby(null);
  const refresh=async()=>{const saved=current.current;if(!alive||!saved||saved.status!=='waiting')return;if(refreshing){refreshAgain=true;return;}refreshing=true;
   const request=new AbortController(),abort=()=>request.abort(),timeout=setTimeout(abort,10000);controller.signal.addEventListener('abort',abort,{once:true});
   try{const value=await postOnline({action:'get',id:saved.id},request.signal);if(alive&&current.current?.id===saved.id){accept(value);setError('');}}
   catch(e){if(alive&&!controller.signal.aborted)setError(request.signal.aborted?'Couldn’t reconnect. Try again.':e instanceof Error?e.message:'Couldn’t reconnect.');}
   finally{clearTimeout(timeout);controller.signal.removeEventListener('abort',abort);refreshing=false;if(refreshAgain){refreshAgain=false;void refresh();}}
  };
  retry.current=()=>void refresh();
  const foreground=()=>{if(document.documentElement.dataset.ionScreenActive!=='false'&&document.visibilityState==='visible')void refresh();};
  const off=client.subscribe(channels.player(userId),()=>void refresh()),again=client.onReconnect(()=>void refresh()),status=client.onStatus(state=>{if(state==='connected')void refresh();});
  // Realtime is at-most-once; recover a match missed during the first subscription.
  const timer=undefined; // Realtime reconnect and foreground reconcile without idle polling.
  window.addEventListener('focus',foreground);window.addEventListener('online',foreground);window.addEventListener('ion.screen-visibility',foreground);document.addEventListener('visibilitychange',foreground);
  setBusy(true);setError('');void client.connect().then(async()=>{if(!alive)return;const stored=savedId;let value:Lobby|undefined;if(stored)try{const old=await postOnline({action:'get',id:stored},controller.signal);if(old.status!=='cancelled')value=old;}catch(e){if(!e||typeof e!=='object'||!('status'in e)||e.status!==404)throw e;}value||=await postOnline(kind==='create'?{action:'create',variant,...(params.get('family')==='checkers'?{family:'checkers' as const}:{})}:{action:'find',variant,...(params.get('family')==='checkers'?{family:'checkers' as const}:{})},controller.signal);if(alive){try{sessionStorage.setItem('ion.online.room',value.id);}catch{}accept(value);await refresh();}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Couldn’t connect.');}).finally(()=>{if(alive)setBusy(false);});
  return()=>{alive=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',foreground);window.removeEventListener('online',foreground);window.removeEventListener('ion.screen-visibility',foreground);document.removeEventListener('visibilitychange',foreground);off();again();status();client.close();retry.current=null;started.current='';const waiting=current.current;if(waiting?.status==='waiting')void postOnline({action:'cancel',id:waiting.id}).catch(()=>{});};
 },[userId,join,location.search,attempt]);
 if(authState.type==='loading')return <div className={styles.space}><Spinner aria-label="Opening Online"/></div>;
 if(!userId)return <div className={styles.space}><p className={styles.muted}>Email is required to play online.</p><Button asChild><Link to={'/login?mode=signin&back='+encodeURIComponent(location.pathname+location.search)}>Sign in</Link></Button></div>;
 return <div className={styles.space}>
 {join?<form noValidate className={styles.form} onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{const value=await postOnline({action:'join',code});navigate('/?cloud=online-lobby&room='+value.id,{replace:true});}catch(e){setError(e instanceof Error?e.message:'Couldn’t join.');}finally{setBusy(false);}}}><label htmlFor="room-code" className={styles.muted}>Room code</label><Input id="room-code" inputMode="numeric" autoComplete="off" value={code} maxLength={4} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} aria-invalid={!!error} aria-describedby={error?'online-error':undefined}/><Button type="submit" disabled={busy||code.length!==4}>{busy?'Joining…':'Join'}</Button></form>:<>
 {lobby?.code&&<p className={styles.code}>{lobby.code}</p>}
 {lobby?.status==='cancelled'?<p className={styles.muted}>Room closed.</p>:<><Spinner aria-label="Waiting for players"/><p className={styles.muted}>{lobby?lobby.players.length+' / '+lobby.needed:'Connecting…'}</p>{lobby&&<p className={styles.muted}>{chessVariants.label(lobby.variant)}</p>}</>}
 <div className={styles.actions}>{lobby?.code&&<Button variant="ghost" onClick={()=>void navigator.clipboard.writeText(lobby.code!).then(()=>setError('Code copied.')).catch(()=>setError('Select the code to copy it.'))}>Copy code</Button>}<Button variant="ghost" disabled={busy} onClick={async()=>{if(lobby)try{await postOnline({action:'cancel',id:lobby.id});}catch(e){setError(e instanceof Error?e.message:'Couldn’t leave.');return;}try{sessionStorage.removeItem('ion.online.room');}catch{}navigate(params.get('family')==='checkers'?'/?cloud=checkers-online&space=chess':'/?cloud=online',{replace:true});}}>Cancel</Button></div>
 </>}
 {error&&<p id="online-error" className={styles.error} role="alert">{error}</p>}
 {!join&&error&&<Button variant="ghost" onClick={()=>lobby?retry.current?.():setAttempt(value=>value+1)}>Retry</Button>}
 </div>;
}
