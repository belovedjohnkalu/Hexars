import {useLayoutEffect,useSyncExternalStore} from 'react';
export const inversionCloudId='6d71a9db-dc68-4fe7-8e07-a75015fc1abd';
const key='ion.appearance.dark',event='ion-appearance';
let memory=false,unsaved=false;
export function readDarkAppearance(){if(typeof window==='undefined')return false;if(unsaved)return memory;try{return localStorage.getItem(key)==='true';}catch{return memory;}}
function subscribe(update:()=>void){window.addEventListener(event,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};}
export function appearanceChrome(dark:boolean){return{themeColor:dark?'#08090b':'#fafaf9',colorScheme:dark?'dark':'light',statusBarStyle:'default'};}
export function applyAppearance(dark:boolean){document.documentElement.dataset.ionTheme=dark?'dark':'light';document.documentElement.dataset.ionInverted='false';document.body.classList.toggle('dark',dark);}
export function setDarkAppearance(dark:boolean){memory=dark;try{localStorage.setItem(key,String(dark));unsaved=false;}catch{unsaved=true;}applyAppearance(dark);window.dispatchEvent(new window.Event(event));}
export function toggleAppearance(){setDarkAppearance(!readDarkAppearance());}
export function useAppearance(){const dark=useSyncExternalStore(subscribe,readDarkAppearance,()=>false);return{dark,inverted:dark,toggle:toggleAppearance};}
export function AppearanceSync(){const{dark}=useAppearance();useLayoutEffect(()=>applyAppearance(dark),[dark]);return null;}
