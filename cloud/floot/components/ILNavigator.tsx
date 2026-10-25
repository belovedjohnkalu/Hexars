import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {postIL} from '../endpoints/il_POST.schema';
import {useAuth} from '../helpers/useAuth';
import {LoadingScreen} from './LoadingScreen';
import {Button} from './Button';
export function ILNavigator({il}:{il:string}){
 const navigate=useNavigate(),{authState}=useAuth(),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(authState.type==='loading')return;const controller=new AbortController();setError('');void postIL({action:'resolve',il},controller.signal).then(result=>{if(!controller.signal.aborted)navigate(result.items[0].url,{replace:true});}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'This IL isn’t available.');});return()=>controller.abort();},[il,attempt,authState.type,authState.type==='authenticated'?authState.user.id:null,navigate]);
 return <main style={{height:'var(--ion-visual-height,100dvh)',display:'grid',placeContent:'center',gap:12,padding:24,textAlign:'center'}}>{error?<><p role="alert">{error}</p><Button onClick={()=>setAttempt(n=>n+1)}>Retry</Button><Button variant="ghost" onClick={()=>navigate('/',{replace:true})}>ION</Button></>:<LoadingScreen label="Opening cloud"/>}</main>;
}
