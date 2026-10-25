import {useEffect,useState} from 'react';
import {deviceData} from './deviceData';
const downloads=new Map<string,Promise<void>>();
export function mediaCacheKey(url:string){try{const u=new URL(url,location.origin);return 'media:'+u.origin+u.pathname;}catch{return 'media:'+url.split('?')[0];}}
export function useCachedMedia(url:string){const owner=deviceData.identity()||'guest',key=mediaCacheKey(url),[cached,setCached]=useState<{key:string;src:string}|null>(null);
 useEffect(()=>{let alive=true,local:string|undefined;void deviceData.get<Blob>(owner,key).then(blob=>{if(!alive||!blob||typeof URL.createObjectURL!=='function')return;local=URL.createObjectURL(blob);setCached({key:owner+key,src:local});});return()=>{alive=false;if(local)URL.revokeObjectURL(local);};},[owner,key]);
 async function remember(){if(downloads.has(owner+key)||deviceData.peek(owner,key))return;const work=(async()=>{try{const result=await fetch(url,{credentials:'omit',cache:'force-cache'});if(!result.ok)return;const blob=await result.blob();if(blob.size&&blob.size<=200*1024*1024&&owner===(deviceData.identity()||'guest'))await deviceData.put(owner,key,blob);}catch{/* A failed cache write never interrupts playback. */}})().finally(()=>downloads.delete(owner+key));downloads.set(owner+key,work);await work;}
 return{src:cached?.key===owner+key?cached.src:url,remember};
}
