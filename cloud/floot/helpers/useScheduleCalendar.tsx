import { useEffect,useMemo,useRef,useState } from 'react';
import { scheduleCalendar } from './scheduleCalendar';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export function useScheduleCalendar(nodes:CloudNode[],timeZone:string|undefined,refresh:()=>Promise<unknown>){
 const zone=scheduleCalendar.zone(timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone),[now,setNow]=useState(Date.now),day=useMemo(()=>scheduleCalendar.today(new Date(now),zone),[now,zone]),year=useRef(day.year),reload=useRef(refresh);reload.current=refresh;
 const enabled=nodes.some(n=>n.id===scheduleCalendar.root);
 useEffect(()=>{if(!enabled)return;let timer:ReturnType<typeof setTimeout>;const update=()=>{const instant=new Date(),current=scheduleCalendar.today(instant,zone);setNow(instant.getTime());if(current.year!==year.current){year.current=current.year;void reload.current();}clearTimeout(timer);timer=setTimeout(update,Math.max(1,scheduleCalendar.nextMidnight(instant,zone)-instant.getTime()+20));};const foreground=()=>{if(document.visibilityState==='visible')update();};update();window.addEventListener('focus',foreground);document.addEventListener('visibilitychange',foreground);return()=>{clearTimeout(timer);window.removeEventListener('focus',foreground);document.removeEventListener('visibilitychange',foreground);};},[enabled,zone]);
 return useMemo(()=>enabled?scheduleCalendar.paint(nodes,day):nodes,[nodes,enabled,day]);
}
