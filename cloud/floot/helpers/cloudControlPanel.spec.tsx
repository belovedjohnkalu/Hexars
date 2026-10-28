import React from 'react';
import {act,cleanup,fireEvent,render,waitFor} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider,AUTH_QUERY_KEY} from './useAuth';
import {openCloudControls} from './cloudControlPopup';
import {CloudControlLayer} from '../components/CloudControlLayer';

describe('In-place cloud controls',()=>{
 let client:QueryClient,canEdit:boolean,oldCSS:typeof CSS,oldEvent:typeof Event,oldCustom:typeof CustomEvent;
 beforeEach(()=>{
  canEdit=true;oldCSS=globalThis.CSS;oldEvent=globalThis.Event;oldCustom=globalThis.CustomEvent;globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;globalThis.CSS={...globalThis.CSS,escape:(value:string)=>value} as typeof CSS;
  client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity}}});client.setQueryData(AUTH_QUERY_KEY,{id:7,email:'test@example.invalid',role:'user'});spyOn(globalThis,'requestAnimationFrame').and.callFake(callback=>{callback(0);return 1;});
  spyOn(globalThis,'fetch').and.callFake(async (url,init)=>{const body=init?.body?JSON.parse(String(init.body)):{};if(String(url).includes('/_api/library'))return new Response(JSON.stringify({gameId:body.gameId,canRemove:true,canShare:true,dev:false}),{status:200,headers:{'Content-Type':'application/json'}});const scope=body.scope||'home';const nodes=scope==='private'?[{id:'private',parentId:null,name:'Journal'},{id:'word',parentId:'private',name:'A thought',canEdit,canCopy:canEdit,identifier:'IL030'}]:[{id:'controls',parentId:'ion',name:'Controls'},{id:'edit',parentId:'controls',name:'Edit',destination:'control',control:'rename'},{id:'remove',parentId:'controls',name:'Delete',destination:'control',control:'remove'},{id:'copy',parentId:'controls',name:'Copy',destination:'control',control:'copy-text'}];return new Response(JSON.stringify({nodes,version:1,userId:7,scope,dev:false,canAdd:true}),{status:200,headers:{'Content-Type':'application/json'}});});
 });
 afterEach(()=>{cleanup();client.clear();globalThis.CSS=oldCSS;globalThis.Event=oldEvent;globalThis.CustomEvent=oldCustom;});
 function detail(error:unknown):never{const list=(error as {errors?:unknown[]})?.errors;throw new Error(list?list.map(e=>e instanceof Error?e.stack||e.message:String(e)).join('\n'):String(error));}
 function mount(){try{return render(<QueryClientProvider client={client}><AuthProvider><BrowserRouter><CloudControlLayer/></BrowserRouter></AuthProvider></QueryClientProvider>);}catch(error){return detail(error);}}
 it('opens the permitted actions without changing the page and starts the existing editor',async()=>{
  const view=mount(),before=location.href;let edited:unknown;const listener=(e:Event)=>{edited=(e as CustomEvent).detail;};window.addEventListener('ion.edit-cloud',listener);
  try{await act(async()=>openCloudControls({id:'word',parentId:'private',name:'A thought'},'private','/?cloud=private'));}catch(error){detail(error);}
  await waitFor(()=>expect(view.getByRole('button',{name:'Edit'})).toBeTruthy());expect(location.href).toBe(before);expect(view.getByRole('button',{name:'Delete'})).toBeTruthy();
  fireEvent.click(view.getByRole('button',{name:'Edit'}));await waitFor(()=>expect(edited).toEqual(jasmine.objectContaining({id:'word',scope:'private'})));window.removeEventListener('ion.edit-cloud',listener);
 });
 it('does not offer edit or delete for a read-only cloud',async()=>{
  canEdit=false;const view=mount();try{await act(async()=>openCloudControls({id:'word',parentId:'private',name:'A thought',canEdit:true},'private','/?cloud=private'));}catch(error){detail(error);}
  await waitFor(()=>expect(view.getByRole('button',{name:'Copy'})).toBeTruthy());expect(view.queryByRole('button',{name:'Edit'})).toBeNull();expect(view.queryByRole('button',{name:'Delete'})).toBeNull();
 });
 it('opens saved-game actions in place and keeps the delete confirmation',async()=>{
  const view=mount(),before=location.href;await act(async()=>openCloudControls({id:'history-entry',parentId:'history',name:'Game'},'chess','/?cloud=game-history',{game:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}));
  await waitFor(()=>expect(view.getByRole('button',{name:'Share'})).toBeTruthy());expect(location.href).toBe(before);fireEvent.click(view.getByRole('button',{name:'Delete'}));await waitFor(()=>expect(view.getByText('Delete saved game?')).toBeTruthy());fireEvent.click(view.getByRole('button',{name:'Keep game'}));expect(location.href).toBe(before);
 });
});
