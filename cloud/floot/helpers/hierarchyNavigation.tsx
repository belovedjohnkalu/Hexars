import {safePageURL} from './pageURL';
import {isControlsPage} from './visitedPages';
const branches=new Map<string,Map<string,string>>();let version=0;const listeners=new Set<()=>void>();
export const hierarchyNavigation={
 version:()=>version,subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
 record(key:string,current:string,parent:string){if(!safePageURL(current)||!safePageURL(parent)||current===parent||isControlsPage(current)||isControlsPage(parent))return;let map=branches.get(key);if(!map){map=new Map();branches.set(key,map);if(branches.size>64)branches.delete(branches.keys().next().value!);}if(map.get(parent)===current)return;map.set(parent,current);if(map.size>512)map.delete(map.keys().next().value!);version++;for(const fn of listeners)fn();},
 child:(key:string,url:string)=>branches.get(key)?.get(url)||null,
 clear(){branches.clear();version++;for(const fn of listeners)fn();},
};
