import {useLayoutEffect,useSyncExternalStore} from 'react';
export const inversionCloudId='6d71a9db-dc68-4fe7-8e07-a75015fc1abd';
const key='ion.appearance.dark',event='ion-appearance';
let memory=false,unsaved=false;
export function readDarkAppearance(){if(typeof window==='undefined')return false;if(unsaved)return memory;try{return localStorage.getItem(key)==='true';}catch{return memory;}}
function subscribe(update:()=>void){window.addEventListener(event,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};}
export function appearanceChrome(dark:boolean){return{themeColor:dark?'#08090b':'#fafaf9',colorScheme:dark?'dark':'light',statusBarStyle:'default'};}
// Helmet includes this trusted, constant script in the published document head.
// It runs before app modules or stylesheets, including on a cold reload.
export const appearanceBootstrap='(function(c){var d=false;try{d=localStorage.getItem(c.key)==="true";}catch(e){}var r=document.documentElement,s=d?"dark":"light",b=d?c.dark:c.light;r.dataset.ionTheme=s;r.dataset.ionInverted="false";r.style.colorScheme=s;r.style.backgroundColor=b;var t=document.querySelector("meta[name=theme-color]"),m=document.querySelector("meta[name=color-scheme]");if(t)t.content=b;if(m)m.content=s;})('+JSON.stringify({key,light:appearanceChrome(false).themeColor,dark:appearanceChrome(true).themeColor})+');';
export function applyAppearance(dark:boolean){const chrome=appearanceChrome(dark),root=document.documentElement;root.dataset.ionTheme=dark?'dark':'light';root.dataset.ionInverted='false';root.style.colorScheme=chrome.colorScheme;root.style.backgroundColor=chrome.themeColor;document.body?.classList.toggle('dark',dark);document.querySelector<HTMLMetaElement>('meta[name=theme-color]')?.setAttribute('content',chrome.themeColor);document.querySelector<HTMLMetaElement>('meta[name=color-scheme]')?.setAttribute('content',chrome.colorScheme);}
export function setDarkAppearance(dark:boolean){memory=dark;try{localStorage.setItem(key,String(dark));unsaved=false;}catch{unsaved=true;}applyAppearance(dark);window.dispatchEvent(new window.Event(event));}
export function toggleAppearance(){setDarkAppearance(!readDarkAppearance());}
export function useAppearance(){const dark=useSyncExternalStore(subscribe,readDarkAppearance,()=>false);return{dark,inverted:dark,toggle:toggleAppearance};}
export function AppearanceSync(){const{dark}=useAppearance();useLayoutEffect(()=>applyAppearance(readDarkAppearance()),[dark]);return null;}
