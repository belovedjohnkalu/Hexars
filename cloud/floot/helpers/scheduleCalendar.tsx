import type { CloudNode } from '../endpoints/cloud_POST.schema';
type Day={year:number;month:number;day:number};
const root='b23120d8-6452-4e58-8b01-456174d44437',startYear=2026;
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function zone(value?:string){try{if(value)return new Intl.DateTimeFormat('en',{timeZone:value}).resolvedOptions().timeZone;}catch{}return 'UTC';}
function today(now:Date,timeZone:string):Day{const p=new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn',{timeZone:zone(timeZone),year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);const get=(type:string)=>Number(p.find(n=>n.type===type)?.value);return {year:get('year'),month:get('month'),day:get('day')};}
const key=(date:Day)=>date.year*10000+date.month*100+date.day;
function nextMidnight(now:Date,timeZone:string){const current=key(today(now,timeZone));let low=now.getTime(),high=low+36*3600000;while(high-low>1){const middle=Math.floor((low+high)/2);if(key(today(new Date(middle),timeZone))===current)low=middle;else high=middle;}return high;}
const days=(year:number,month:number)=>new Date(Date.UTC(year,month,0)).getUTCDate();
function ensure(nodes:CloudNode[],throughYear:number,createId:()=>string,createdBy?:number){
 if(!nodes.some(n=>n.id===root&&!n.removedBy))return nodes;
 const children=new Map<string,CloudNode[]>();for(const n of nodes)if(n.parentId&&!n.removedBy){const list=children.get(n.parentId)||[];list.push(n);children.set(n.parentId,list);}
 const replacements=new Map<string,CloudNode>(),added:CloudNode[]=[];
 const obtain=(parentId:string,name:string,date:NonNullable<CloudNode['calendarDate']>)=>{
  const existing=(children.get(parentId)||[]).find(n=>n.calendarDate?n.calendarDate.year===date.year&&n.calendarDate.month===date.month&&n.calendarDate.day===date.day:n.name.trim()===name);
  if(existing){if(!existing.calendarDate){const update={...existing,calendarDate:date};replacements.set(existing.id,update);return update;}return existing;}
  const node:CloudNode={id:createId(),parentId,name,calendarDate:date,color:'white',...(createdBy?{createdBy}:{})};added.push(node);const list=children.get(parentId)||[];list.push(node);children.set(parentId,list);return node;
 };
 for(let year=startYear;year<=throughYear;year++){const y=obtain(root,String(year),{year});for(let month=1;month<=12;month++){const m=obtain(y.id,months[month-1],{year,month});for(let day=1;day<=days(year,month);day++)obtain(m.id,String(day),{year,month,day});}}
 return replacements.size||added.length?[...nodes.map(n=>replacements.get(n.id)||n),...added]:nodes;
}
function paint(nodes:CloudNode[],current:Day){
 const hidden=new Set(nodes.filter(n=>n.calendarDate&&n.calendarDate.year>current.year+4).map(n=>n.id));
 let grew=true;while(grew){grew=false;for(const node of nodes)if(node.parentId&&hidden.has(node.parentId)&&!hidden.has(node.id)){hidden.add(node.id);grew=true;}}
 return nodes.filter(n=>!hidden.has(n.id)).map(n=>{const date=n.calendarDate;if(!date)return n;const a=date.day?key(date as Day):date.month?date.year*12+date.month:date.year,b=date.day?key(current):date.month?current.year*12+current.month:current.year;const status=a<b?'past':a>b?'future':'current';return {...n,color:status==='past'?'#82f398' as const:status==='future'?'#f38282' as const:'white' as const,calendarStatus:status as 'past'|'current'|'future'};});
}
export const scheduleCalendar={root,startYear,months,zone,today,nextMidnight,days,ensure,paint};
