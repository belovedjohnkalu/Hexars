import styles from './BoardPreview.module.css';
import { useEffect,useRef,useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { postLibrary } from '../endpoints/library_POST.schema';
import { CloudBoard } from './CloudBoard';
import { Spinner } from './Spinner';
export function SavedBoardPreview({gameId,shareId}:{gameId:string;shareId?:string}){
 const ref=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),client=useQueryClient();
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'100px'});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const refresh=()=>{void client.invalidateQueries({queryKey:['library-preview',gameId,shareId]});};window.addEventListener('ion.library.changed',refresh);return()=>window.removeEventListener('ion.library.changed',refresh);},[gameId,shareId,client]);
 const {data,error}=useQuery({queryKey:['library-preview',gameId,shareId],queryFn:({signal})=>postLibrary({action:'get',gameId,shareId},signal),enabled:visible,staleTime:30000,refetchOnMount:'always',retry:1});
 return <span ref={ref} className={styles.preview} data-saved-preview={gameId} data-state-id={data?.game.stateId}>{data?<CloudBoard game={data.game} selected={null} onCell={()=>{}} flipped={false} coordinates={false} theme="neutral" disabled preview lastMove={data.moves.at(-1)}/>:error?<span role="img" aria-label="Saved position unavailable">—</span>:<Spinner size="sm" aria-label="Opening saved position"/>}</span>;
}
