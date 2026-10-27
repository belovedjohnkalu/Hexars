export function puzzleCalendar(timeZone='UTC',now=new Date()){
 const format=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 const date=(ms:number)=>{const p=Object.fromEntries(format.formatToParts(ms).map(p=>[p.type,p.value]));return p.year+'-'+p.month+'-'+p.day;};
 const day=date(now.getTime());let lo=now.getTime(),hi=lo+36*60*60*1000;
 while(hi-lo>1000){const mid=Math.floor((lo+hi)/2);if(date(mid)===day)lo=mid;else hi=mid;}
 return{day,ordinal:Math.floor(Date.parse(day+'T00:00:00Z')/86400000),expiresAt:new Date(hi+1000).toISOString()};
}
export function dailyPuzzleIndex(ordinal:number,count:number,variant:string){
 const offset=Array.from(variant).reduce((n,c)=>n*31+c.charCodeAt(0),0)>>>0;
 return((ordinal+offset)%count+count)%count;
}
