import { useRef,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAccounts } from '../endpoints/auth/accounts_POST.schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { useAuth } from './useAuth';
import { cloudURL } from './cloudRoutes';
export function useAccountCommands(refresh:()=>Promise<unknown>,feedback:(message:string)=>void){
 const navigate=useNavigate(),{logout}=useAuth(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[forget,setForget]=useState<number|null>(null),lock=useRef(false);
 const accounts=cloudURL('accounts','accounts');
 const form=(mode:string,add=false)=>'/login?'+new URLSearchParams({mode,back:accounts,...(add?{add:'1',remember:'1'}:{})});
 async function command(node:CloudNode){const action=node.accountAction;if(!action||lock.current)return;
  if(action==='signin'||action==='signup'||action==='recover'){navigate(form(action));return;}
  if(action.startsWith('forget:')){setForget(Number(action.split(':')[1]));return;}
  lock.current=true;setBusy(true);setError('');
  try{
   if(action==='add'){await postAccounts({action:'remember'});navigate(form('signin',true));}
   else if(action==='remember'){await postAccounts({action:'remember'});await refresh();feedback('Remembered');}
   else if(action==='signout'){await logout();navigate(accounts,{replace:true});feedback('Signed out');}
   else if(action.startsWith('switch:')){await postAccounts({action:'switch',userId:Number(action.split(':')[1])});try{sessionStorage.removeItem('ion.word-drafts.v1');}catch{}window.location.assign(accounts);}
  }catch(e){setError(e instanceof Error?e.message:'Couldn’t update this account. Try again.');}
  finally{lock.current=false;setBusy(false);}
 }
 async function confirmForget(){if(!forget||lock.current)return;lock.current=true;setBusy(true);setError('');try{await postAccounts({action:'forget',userId:forget});setForget(null);await refresh();navigate(accounts,{replace:true});feedback('Forgotten');}catch(e){setError(e instanceof Error?e.message:'Couldn’t forget this account. Try again.');}finally{lock.current=false;setBusy(false);}}
 return {command,busy,error,forget,cancelForget:()=>setForget(null),confirmForget};
}
