import { useSyncExternalStore } from 'react';
import {randomWordColor,type CloudColor} from './cloudColors';
export const randomColorCloudId='057a5800-7740-4b87-bcd2-8d708d928f6a';
const key='ion.word-color.random',event='ion-word-color';
let memory=true,unsaved=false;
const recentPaint:CloudColor[]=[];
export function nextRandomWordColor(used:readonly (CloudColor|undefined)[],random:()=>number=Math.random):CloudColor{
 const color=randomWordColor([...used,...recentPaint],random);
 recentPaint.push(color);if(recentPaint.length>4)recentPaint.shift();
 return color;
}
function read(){if(typeof window==='undefined')return true;if(unsaved)return memory;try{return localStorage.getItem(key)!=='false';}catch{return memory;}}
function subscribe(update:()=>void){window.addEventListener(event,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};}
export function toggleRandomWordColor(){memory=!read();try{localStorage.setItem(key,String(memory));unsaved=false;}catch{unsaved=true;}window.dispatchEvent(new window.Event(event));}
export function useRandomWordColor(){return {enabled:useSyncExternalStore(subscribe,read,()=>true),toggle:toggleRandomWordColor};}
