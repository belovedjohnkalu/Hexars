import { useEffect,useState } from 'react';
import { postTime } from '../endpoints/time_POST.schema';
export function useTimeEarning(userId:number|null,onCredit:()=>void){
 const [status,setStatus]=useState<'earning'|'paused'|'elsewhere'|'offline'|'signed-out'>('signed-out');
 useEffect(()=>{
  if(!userId){setStatus('signed-out');return;}
  const leaseId=crypto.randomUUID();let alive=true,claimed=false,elsewhere=false,sequence=0,lastInteraction=performance.now(),queue=Promise.resolve();
  const eligible=()=>document.visibilityState==='visible'&&document.hasFocus()&&performance.now()-lastInteraction<180000;
  const run=(operation:'claim'|'heartbeat'|'stop')=>{queue=queue.then(async()=>{
   if(!alive&&operation!=='stop')return;
   const age=Math.min(86400000,Math.max(0,Math.floor(performance.now()-lastInteraction)));
   try{const result=await postTime({action:'earning',operation,leaseId,sequence:++sequence,idleAgeMs:age});if(!alive)return;
    elsewhere=!!result.earning?.elsewhere;claimed=!!result.earning?.active&&!elsewhere;if(result.earning?.creditedUs&&result.earning.creditedUs!=='0')onCredit();
    setStatus(result.earning?.elsewhere?'elsewhere':eligible()&&result.earning?.active?'earning':'paused');
   }catch(e){if(alive){claimed=false;setStatus('offline');if(e&&typeof e==='object'&&'status'in e&&e.status===401)window.dispatchEvent(new Event('ion.session-expired'));}}
  });};
  const activity=(event:Event)=>{if(!event.isTrusted)return;elsewhere=false;const wasIdle=performance.now()-lastInteraction>=180000;lastInteraction=performance.now();if(eligible()&&(wasIdle||!claimed))run('claim');};
  const visibility=()=>{if(eligible())run('claim');else{setStatus('paused');if(claimed)run('stop');}};
  const focus=()=>{elsewhere=false;lastInteraction=performance.now();visibility();};
  const tick=()=>{if(eligible()){if(claimed)run('heartbeat');else if(!elsewhere)run('claim');}else{setStatus('paused');if(claimed)run('stop');}};
  const timer=setInterval(tick,15000);visibility();
  for(const type of ['pointerdown','keydown'])window.addEventListener(type,activity,{passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('focus',focus);window.addEventListener('blur',visibility);window.addEventListener('online',visibility);window.addEventListener('pagehide',visibility);
  return()=>{alive=false;clearInterval(timer);for(const type of ['pointerdown','keydown'])window.removeEventListener(type,activity);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('focus',focus);window.removeEventListener('blur',visibility);window.removeEventListener('online',visibility);window.removeEventListener('pagehide',visibility);if(claimed)run('stop');};
 },[userId,onCredit]);
 return status;
}
