import {useEffect,useState,useMemo} from 'react';
import type {CloudScope} from '../endpoints/cloud_POST.schema';
import {cloudOutbox,type OutboxJob} from './cloudOutbox';
import {deviceData} from './deviceData';
export function useCloudOutbox(uid:number|null,scope:CloudScope){const[list,setList]=useState<OutboxJob[]>([]);
 useEffect(()=>{let alive=true;const update=()=>{if(!uid){setList([]);return;}void cloudOutbox.jobs(uid,scope).then(value=>{if(alive)setList(value);});};update();const off=cloudOutbox.subscribe(key=>{if(key===uid+':'+scope)update();}),cacheOff=deviceData.subscribe(key=>{if(key.startsWith(uid+':outbox:'+scope+':'))update();}),online=()=>{if(uid)void cloudOutbox.drain(uid,scope);};window.addEventListener('online',online);online();return()=>{alive=false;off();cacheOff();window.removeEventListener('online',online);};},[uid,scope]);
 const visible=useMemo(()=>list.filter(j=>j.owner===uid&&j.scope===scope),[list,uid,scope]),nodes=useMemo(()=>cloudOutbox.nodes(visible),[visible]);return{jobs:visible,nodes,retry:(id:string)=>uid?cloudOutbox.retry(uid,scope,id):Promise.resolve(),discard:(id:string)=>uid?cloudOutbox.discard(uid,scope,id):Promise.resolve()};}
