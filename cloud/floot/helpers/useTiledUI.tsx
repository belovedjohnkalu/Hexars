import {useLayoutEffect,useSyncExternalStore} from 'react';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
export const tiledUICloudId='account-tiled-ui';
const key='ion.layout.tiled',event='ion-layout';
let memory=false,unsaved=false;
export function readTiledUI(){if(typeof window==='undefined')return false;if(unsaved)return memory;try{return localStorage.getItem(key)==='true';}catch{return memory;}}
function subscribe(update:()=>void){window.addEventListener(event,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};}
export function setTiledUI(tiled:boolean){memory=tiled;try{localStorage.setItem(key,String(tiled));unsaved=false;}catch{unsaved=true;}document.documentElement.dataset.ionLayout=tiled?'tiled':'organic';window.dispatchEvent(new window.Event(event));}
export function toggleTiledUI(){setTiledUI(!readTiledUI());}
export function useTiledUI(){return useSyncExternalStore(subscribe,readTiledUI,()=>false);}
export function LayoutSync(){const tiled=useTiledUI();useLayoutEffect(()=>{document.documentElement.dataset.ionLayout=readTiledUI()?'tiled':'organic';},[tiled]);return null;}
const tiledWords={collection:'Tiles',unit:'Tile',unitLower:'tile',partition:'Partition',partitionLower:'partition',partitions:'Partitions'} as const;
const organicWords={collection:'Skies',unit:'Sky',unitLower:'sky',partition:'Screen',partitionLower:'screen',partitions:'Screens'} as const;
export function layoutWords(tiled:boolean){return tiled?tiledWords:organicWords;}
export function layoutCloud(node:CloudNode,tiled:boolean):CloudNode{
 if(tiled)return node;
 const defaults:Record<string,[string,string]>={'page-tiles':['Tiles','Skies'],'page-tile-new':['New Tile','New Sky']},names=defaults[node.id];
 return names&&node.name===names[0]?{...node,name:names[1]}:node;
}
