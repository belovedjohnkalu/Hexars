import {useLayoutEffect} from 'react';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
// The former device preference is retired. Every screen now uses joined tiles,
// including accounts that previously saved Organic UI on this device.
export function readTiledUI(){return true;}
export function useTiledUI(){return true;}
export function LayoutSync(){useLayoutEffect(()=>{document.documentElement.dataset.ionLayout='tiled';try{localStorage.removeItem('ion.layout.tiled');}catch{}},[]);return null;}
const tiledWords={collection:'Tiles',unit:'Tile',unitLower:'tile',partition:'Partition',partitionLower:'partition',partitions:'Partitions'} as const;
export function layoutWords(_tiled:boolean){return tiledWords;}
export function layoutCloud(node:CloudNode,_tiled:boolean):CloudNode{return node;}
