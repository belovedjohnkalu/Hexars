import { useEffect,useRef,useState } from 'react';
import type { TimeSnapshot } from '../endpoints/time_POST.schema';
import { timeCredit } from './timeMath';
export {timeClock} from './timeMath';
export function pendingTime(snapshot:TimeSnapshot|null,elapsedMs:number,earning:boolean){
 if(!earning||!snapshot?.observedAt||!snapshot.earning?.active)return 0n;
 return timeCredit(Date.parse(snapshot.earning.lastSeen),Date.parse(snapshot.observedAt)+Math.max(0,elapsedMs),Date.parse(snapshot.earning.idleUntil),true);
}
// A display projection only. Purchases/transfers always use the posted ledger.
export function useTimeTotals(snapshot:TimeSnapshot|null,status:string){
 const [clock,setClock]=useState(()=>performance.now()),baseline=useRef({at:snapshot?.observedAt,received:performance.now()});
 if(baseline.current.at!==snapshot?.observedAt)baseline.current={at:snapshot?.observedAt,received:performance.now()};
 useEffect(()=>{if(status!=='earning')return;const timer=setInterval(()=>setClock(performance.now()),1000);return()=>clearInterval(timer);},[status]);
 const pending=pendingTime(snapshot,clock-baseline.current.received,status==='earning'&&document.visibilityState==='visible'&&document.hasFocus());
 return{addedUs:(BigInt(snapshot?.addedUs||snapshot?.earnedUs||'0')+pending).toString(),spentUs:snapshot?.spentUs||'0',balanceUs:(BigInt(snapshot?.balanceUs||'0')+pending).toString()};
}
