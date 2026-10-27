import {useLayoutEffect} from 'react';
export {inversionCloudId} from './appearanceSettings';
const key='ion.appearance.dark',event='ion-appearance';
// Clear old preferences so every open ION screen converges on the light canvas.
export function readDarkAppearance(){return false;}
export function appearanceChrome(_dark:boolean){return{themeColor:'#fafaf9',colorScheme:'light',statusBarStyle:'default'};}
export const appearanceBootstrap='(function(c){try{localStorage.removeItem(c.key)}catch(e){}var r=document.documentElement;r.dataset.ionTheme="light";r.dataset.ionInverted="false";r.style.colorScheme="light";r.style.backgroundColor=c.light;var t=document.querySelector("meta[name=theme-color]"),m=document.querySelector("meta[name=color-scheme]");if(t)t.content=c.light;if(m)m.content="light";})('+JSON.stringify({key,light:appearanceChrome(false).themeColor})+');';
export function applyAppearance(_dark:boolean){const chrome=appearanceChrome(false),root=document.documentElement;root.dataset.ionTheme='light';root.dataset.ionInverted='false';root.style.colorScheme=chrome.colorScheme;root.style.backgroundColor=chrome.themeColor;document.body?.classList.remove('dark');document.querySelector<HTMLMetaElement>('meta[name=theme-color]')?.setAttribute('content',chrome.themeColor);document.querySelector<HTMLMetaElement>('meta[name=color-scheme]')?.setAttribute('content',chrome.colorScheme);}
export function setDarkAppearance(_dark:boolean){try{localStorage.removeItem(key);}catch{}applyAppearance(false);window.dispatchEvent(new window.Event(event));}
export function toggleAppearance(){setDarkAppearance(false);}
export function useAppearance(){return{dark:false,inverted:false,toggle:toggleAppearance};}
export function AppearanceSync(){useLayoutEffect(()=>{setDarkAppearance(false);const sync=()=>applyAppearance(false);window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);return null;}
