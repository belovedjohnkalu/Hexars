import { isPagePane } from './pageWorkspace';
import { useLayoutEffect,useSyncExternalStore } from 'react';
export const inversionCloudId='6d71a9db-dc68-4fe7-8e07-a75015fc1abd';
const key='ion.appearance.inverted',event='ion-appearance';
let memory=false,unsaved=false;
function read(){if(typeof window==='undefined')return false;if(unsaved)return memory;try{return localStorage.getItem(key)==='true';}catch{return memory;}}
function subscribe(update:()=>void){window.addEventListener(event,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};}
export function applyAppearance(active:boolean){document.documentElement.dataset.ionInverted=String(active);document.documentElement.dataset.ionAppearancePane=String(isPagePane());}
export function toggleAppearance(){memory=!read();try{localStorage.setItem(key,String(memory));unsaved=false;}catch{unsaved=true;}applyAppearance(memory);window.dispatchEvent(new window.Event(event));}
export function useAppearance(){const inverted=useSyncExternalStore(subscribe,read,()=>false);return {inverted,toggle:toggleAppearance};}
export function AppearanceSync(){const {inverted}=useAppearance();useLayoutEffect(()=>{applyAppearance(inverted);},[inverted]);return null;}
