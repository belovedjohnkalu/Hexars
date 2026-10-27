import { useEffect, useState } from 'react';
export function useChessDay() {
  const [day,setDay]=useState(()=>new Date());
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const update=()=>{const now=new Date();setDay(old=>old.toDateString()===now.toDateString()?old:now);clearTimeout(timer);timer=setTimeout(update,new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime()+100);};
    update();window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearTimeout(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};
  },[]);
  return day;
}
