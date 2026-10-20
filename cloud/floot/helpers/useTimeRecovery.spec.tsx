import React,{useState} from 'react';
import { render,act,cleanup,waitFor,fireEvent } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider,AUTH_QUERY_KEY } from './useAuth';
import { TimeProvider } from './useTime';
import { TimeAccess } from '../components/TimeAccess';
import { RealtimeClient } from './RealtimeClient';
import type { TimeSnapshot } from '../endpoints/time_POST.schema';
const market:TimeSnapshot={userId:null,dev:false,owner:false,balanceUs:'0',earnedUs:'0',buyers:1,readyAt:null,pricingReady:false,products:[{id:'engine:tactical',kind:'engine',reference:'tactical',name:'Tactical',directUs:null,freeUs:null,costUs:null,priceUs:null,published:false,available:true,owned:false,revenueUs:'0'}]};
function Game(){const [value,setValue]=useState(0);return <button onClick={()=>setValue(value+1)}>Game dialog {value}</button>;}
function App({client}:{client:QueryClient}){return <QueryClientProvider client={client}><AuthProvider><TimeProvider><MemoryRouter><TimeAccess items={['engine:tactical']}><Game/></TimeAccess></MemoryRouter></TimeProvider></AuthProvider></QueryClientProvider>;}
describe('Time account and connection recovery',()=>{
 let client:QueryClient;
 beforeEach(()=>{client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});spyOn(RealtimeClient.prototype,'connect').and.callFake(async()=>{});spyOn(document,'hasFocus').and.returnValue(false);});
 afterEach(()=>{cleanup();client.clear();});
 it('keeps an authorized game and its dialog state through a reconnecting sign-in check',async()=>{
  let release:((value:Response)=>void)|undefined;
  client.setQueryData(AUTH_QUERY_KEY,null);client.setQueryData(['time',null],market);
  spyOn(globalThis,'fetch').and.callFake(async url=>String(url).includes('auth/session')?new Promise<Response>(resolve=>{release=resolve;}):new Response(JSON.stringify({snapshot:market}),{status:200}));
  const view=render(<App client={client}/>);fireEvent.click(view.getByText('Game dialog 0'));
  await act(async()=>{void client.resetQueries({queryKey:AUTH_QUERY_KEY});});
  await waitFor(()=>expect(release).toBeDefined());
  expect(view.getByText('Game dialog 1')).toBeTruthy();
  await act(async()=>{release!(new Response(JSON.stringify({json:{user:null}}),{status:200}));});
  expect(view.getByText('Game dialog 1')).toBeTruthy();
 });
 it('rejects a wallet response belonging to a different account',async()=>{
  client.setQueryData(AUTH_QUERY_KEY,{id:22,email:'time-hook@example.invalid',displayName:'Time hook',role:'user',avatarUrl:null});
  spyOn(globalThis,'fetch').and.callFake(async()=>new Response(JSON.stringify({snapshot:{...market,userId:21,balanceUs:'999999'}}),{status:200}));
  const view=render(<App client={client}/>);
  await waitFor(()=>expect(view.getByText('Sign in again to open Time.')).toBeTruthy(),{timeout:4000});
  expect(view.queryByText('Game dialog 0')).toBeNull();
  expect(client.getQueryData(['time',22])).toBeUndefined();
 });
});
