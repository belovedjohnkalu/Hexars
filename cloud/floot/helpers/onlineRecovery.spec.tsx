import { act,cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter,Route,Routes,useLocation } from 'react-router-dom';
import superjson from 'superjson';
import { OnlineSpace } from '../components/OnlineSpace';
import { AuthProvider } from './useAuth';
import { RealtimeClient,type RealtimeStatus } from './RealtimeClient';
import type { Lobby } from '../endpoints/online_POST.schema';

const roomId='10000000-0000-4000-8000-000000000038',gameId='20000000-0000-4000-8000-000000000038';
const user={id:987660,email:'online-fixture@example.invalid',displayName:'Online fixture',role:'user',avatarUrl:null};
const waiting:Lobby={id:roomId,code:null,variant:'glinski',status:'waiting',gameId:null,players:[{seat:0,name:'Fixture'}],needed:2};
const until=(predicate:()=>boolean)=>waitFor(()=>{if(!predicate())throw new Error('Waiting for online recovery');});
function RouteLocation(){const location=useLocation();return <output data-testid="online-location">{location.pathname+location.search+location.hash}</output>;}

describe('Online waiting-room recovery integration',()=>{
 let client:QueryClient,statuses:Array<(state:RealtimeStatus)=>void>;
 beforeEach(()=>{
  statuses=[];
  spyOn(RealtimeClient.prototype,'connect').and.callFake(async()=>{});
  spyOn(RealtimeClient.prototype,'subscribe').and.returnValue(()=>{});
  spyOn(RealtimeClient.prototype,'onReconnect').and.returnValue(()=>{});
  spyOn(RealtimeClient.prototype,'onStatus').and.callFake(callback=>{statuses.push(callback);return()=>{statuses=statuses.filter(item=>item!==callback);};});
  spyOn(RealtimeClient.prototype,'close').and.stub();
 });
 afterEach(()=>{cleanup();client?.clear();});
 function mount(){
  client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});
  return render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={['/?cloud=online-lobby&space=chess&room='+roomId]}><RouteLocation/><Routes><Route path="/" element={<OnlineSpace/>}/><Route path="/glinski" element={<p>Match opened</p>}/></Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
 }
 it('retries a saved-room 503 in place without creating another match',async()=>{
  let fail=true;const requests:Array<{action:string;id?:string}>=[];
  spyOn(globalThis,'fetch').and.callFake(async(url,init)=>{
   if(String(url).endsWith('/auth/session'))return new Response(superjson.stringify({user}));
   if(!String(url).endsWith('/online'))throw new Error('Unexpected fixture request');
   const input=JSON.parse(String(init?.body));requests.push(input);
   if(input.action==='get'&&fail)return new Response(JSON.stringify({error:'Room temporarily unavailable.'}),{status:503});
   return new Response(JSON.stringify(input.action==='cancel'?{...waiting,status:'cancelled'}:waiting));
  });
  mount();await until(()=>screen.queryByRole('alert')?.textContent==='Room temporarily unavailable.');
  expect(requests.map(item=>item.action)).toEqual(['get']);
  const routeBefore=screen.getByTestId('online-location');fail=false;
  fireEvent.click(screen.getByRole('button',{name:'Retry',exact:true}));
  await until(()=>!!screen.queryByText('1 / 2',{exact:true}));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByTestId('online-location')).toBe(routeBefore);
  expect(routeBefore.textContent).toContain('room='+roomId);
  expect(requests.filter(item=>item.action==='find'||item.action==='create')).toEqual([]);
  expect(requests.filter(item=>item.action==='get').length).toBeGreaterThanOrEqual(2);
  expect(requests.filter(item=>item.action==='get').every(item=>item.id===roomId)).toBeTrue();
 });
 it('fetches on the first connected status and opens a match missed before subscription',async()=>{
  let playing=false,gets=0;
  spyOn(globalThis,'fetch').and.callFake(async(url,init)=>{
   if(String(url).endsWith('/auth/session'))return new Response(superjson.stringify({user}));
   if(!String(url).endsWith('/online'))throw new Error('Unexpected fixture request');
   const input=JSON.parse(String(init?.body));
   if(input.action==='get')gets++;
   return new Response(JSON.stringify(playing?{...waiting,status:'playing',gameId}:waiting));
  });
  mount();await until(()=>!!screen.queryByText('1 / 2',{exact:true})&&gets>=2);
  expect(statuses.length).toBe(1);const before=gets;playing=true;
  await act(async()=>{for(const callback of [...statuses])callback('connected');});
  await until(()=>!!screen.queryByText('Match opened',{exact:true}));
  expect(gets).toBeGreaterThan(before);
  expect(screen.getByTestId('online-location').textContent).toContain('/glinski?mode=online#game='+gameId);
  expect(statuses.length).toBe(0);
 });
});
