import { createContext,useContext,type ReactNode,useCallback,useEffect } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { postTime,type TimeSnapshot } from '../endpoints/time_POST.schema';
import { useAuth } from './useAuth';
import { useTimeEarning } from './useTimeEarning';
import { RealtimeClient } from './RealtimeClient';
import { channels } from './realtimeChannels';
type State={snapshot:TimeSnapshot|null;loading:boolean;error:string;earning:ReturnType<typeof useTimeEarning>;refresh:()=>void};
const Context=createContext<State|null>(null);
export function TimeProvider({children}:{children:ReactNode}){
 const {authState}=useAuth(),userId=authState.type==='authenticated'?authState.user.id:null,qc=useQueryClient(),key=['time',userId];
 const query=useQuery({queryKey:key,queryFn:async({signal})=>{const snapshot=(await postTime({action:'snapshot'},signal)).snapshot!;if(snapshot.userId!==userId)throw new Error('Sign in again to open Time.');return snapshot;},enabled:authState.type!=='loading',staleTime:15000,refetchInterval:60000,retry:1});
 const refresh=useCallback(()=>{void qc.invalidateQueries({queryKey:['time',userId]});void qc.invalidateQueries({queryKey:['time-activity',userId]});void qc.invalidateQueries({queryKey:['time-admin',userId]});void qc.invalidateQueries({queryKey:['work',userId]});},[qc,userId]);
 const earning=useTimeEarning(userId,refresh);
 useEffect(()=>{if(authState.type==='loading')return;const client=new RealtimeClient(),off=client.subscribe(channels.timeCatalog,refresh),privateOff=userId?client.subscribe(channels.time(userId),refresh):()=>{},treasuryOff=query.data?.dev?client.subscribe(channels.timeTreasury,refresh):()=>{},again=client.onReconnect(refresh);void client.connect();return()=>{off();privateOff();treasuryOff();again();client.close();};},[userId,authState.type,refresh,query.data?.dev]);
 return <Context.Provider value={{snapshot:query.data?.userId===userId?query.data:null,loading:authState.type==='loading'||query.isPending,error:query.error?.message||'',earning,refresh}}>{children}</Context.Provider>;
}
export function useTime(){const context=useContext(Context);if(!context)throw new Error('Time provider missing');return context;}
