import {isPagePane} from './pageWorkspace';
// Track only same-app visits. Never infer a forward destination from the browser's
// total history length: that could send someone to another website.
const pages=new Map<number,string>(),entryKeys=new Map<number,string>(),returns=new Map<number,number>(),listeners=new Set<()=>void>();
const storageKey='ion.visited-pages.v2'+(typeof window!=='undefined'&&isPagePane()?'.'+window.name:'');
let version=0,currentIndex:number|undefined,restored=false;
function localVisit(path:string){try{const url=new URL(path,'https://ion.floot.app');return path.startsWith('/')&&url.origin==='https://ion.floot.app'&&url.pathname+url.search+url.hash===path;}catch{return false;}}
function restore(){
 if(restored||typeof window==='undefined')return;restored=true;
 try{
  const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
  if(!saved||!Array.isArray(saved.pages))return;
  for(const entry of saved.pages)if(Array.isArray(entry)&&Number.isInteger(entry[0])&&entry[0]>=0&&typeof entry[1]==='string'&&localVisit(entry[1]))pages.set(entry[0],entry[1]);
  if(Array.isArray(saved.keys))for(const entry of saved.keys)if(Array.isArray(entry)&&Number.isInteger(entry[0])&&typeof entry[1]==='string'&&pages.has(entry[0]))entryKeys.set(entry[0],entry[1]);
  if(Array.isArray(saved.returns))for(const entry of saved.returns)if(Array.isArray(entry)&&Number.isInteger(entry[0])&&Number.isInteger(entry[1])&&entry[1]>entry[0]&&pages.has(entry[0])&&pages.has(entry[1]))returns.set(entry[0],entry[1]);
 }catch{/* Restricted storage never disables navigation. */}
}
function notify(){version++;try{sessionStorage.setItem(storageKey,JSON.stringify({pages:[...pages],keys:[...entryKeys],returns:[...returns]}));}catch{}for(const listener of listeners)listener();}
export function subscribeVisitedPages(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export const visitedPagesVersion=()=>version;
export function isControlsPage(path:string){try{const p=new URL(path,'https://ion.floot.app').searchParams;return p.get('cloud')==='controls'&&(p.has('selected')||p.has('game')||p.has('origin'));}catch{return false;}}
export function safeBackTarget(path:string){const seen=new Set<string>();let value=path;while(isControlsPage(value)){if(seen.has(value))return '/';seen.add(value);const origin=new URL(value,'https://ion.floot.app').searchParams.get('origin');value=origin?.startsWith('/')&&!origin.startsWith('//')?origin:'/';}try{const url=new URL(value,'https://ion.floot.app');return value.startsWith('/')&&url.origin==='https://ion.floot.app'?url.pathname+url.search+url.hash:'/';}catch{return '/';}}
export function recordVisitedPage(index:number,path:string,pushed=false,entryKey?:string){
 restore();if(!Number.isInteger(index)||index<0||!localVisit(path))return;
 // An entirely new browser entry may reuse idx=0. A per-entry stamp prevents
 // a saved tab cache from inventing Forward destinations on that new timeline.
 if(currentIndex===undefined&&entryKey&&entryKeys.get(index)!==entryKey){pages.clear();entryKeys.clear();returns.clear();}
 if(pushed){for(const key of pages.keys())if(key>index){pages.delete(key);entryKeys.delete(key);}for(const [from,to]of returns)if(from>=index||to>=index)returns.delete(from);}
 // If Back skipped Controls or a duplicate return, Forward reverses that same
 // logical visit rather than stopping at the skipped intermediary.
 if(!pushed&&currentIndex!==undefined&&index<currentIndex&&pages.has(currentIndex)&&!isControlsPage(pages.get(currentIndex)!)&&pages.get(currentIndex)!==path)returns.set(index,currentIndex);
 const changed=pages.get(index)!==path||currentIndex!==index;
 pages.set(index,path);if(entryKey)entryKeys.set(index,entryKey);currentIndex=index;if(changed||pushed)notify();
}
export function previousPageStep(index:number){if(!pages.has(index))return 0;for(let i=index-1;i>=0;i--){const path=pages.get(i);if(path===undefined)return 0;if(!isControlsPage(path)&&path!==pages.get(index))return i-index;}return 0;}
export function nextPageStep(index:number){
 if(!pages.has(index))return 0;
 const remembered=returns.get(index);
 if(remembered!==undefined&&pages.has(remembered)&&!isControlsPage(pages.get(remembered)!)&&pages.get(remembered)!==pages.get(index))return remembered-index;
 for(let i=index+1;i<=Math.max(index,...pages.keys());i++){const path=pages.get(i);if(path===undefined)return 0;if(!isControlsPage(path)&&path!==pages.get(index))return i-index;}return 0;
}
// Tests and account-scoped environments can discard their isolated history.
export function clearVisitedPages(){pages.clear();entryKeys.clear();returns.clear();currentIndex=undefined;restored=true;try{sessionStorage.removeItem(storageKey);}catch{}notify();}
