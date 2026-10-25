import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {CloudLinkEditor} from '../components/CloudLinkEditor';
import {CloudILSearch} from '../components/CloudILSearch';
import type {CloudRedirect} from './cloudLinks';
describe('IL search and redirect interactions',()=>{
 let oldEvent:typeof Event,oldCustom:typeof CustomEvent;
 beforeEach(()=>{oldEvent=globalThis.Event;oldCustom=globalThis.CustomEvent;globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;});
 afterEach(async()=>{await act(async()=>{cleanup();await new Promise(r=>setTimeout(r,0));});globalThis.Event=oldEvent;globalThis.CustomEvent=oldCustom;});
 it('offers Item, URL and IL after choosing the whole cloud, then validates the IL before saving',async()=>{
  const onSave=jasmine.createSpy('save').and.resolveTo(true),onClose=jasmine.createSpy('close');
  spyOn(globalThis,'fetch').and.callFake(async(_url,init)=>{expect(JSON.parse(String(init?.body))).toEqual({action:'resolve',il:'IL02A1'});return new Response(JSON.stringify({items:[{id:'result',name:'Result',il:'IL02A1',scope:'public',url:'/?cloud=result&space=public'}],page:0,pages:1,total:1}));});
  render(<CloudLinkEditor node={{id:'word',name:'Alpha Beta',parentId:'public'}} scope="public" nodes={[]} busy={false} onClose={onClose} onSave={onSave} loadTarget={async()=>({nodes:[],version:0})}/>);
  fireEvent.click(screen.getByRole('button',{name:'Whole cloud',exact:true}));
  for(const name of ['Item','URL','IL'])expect(screen.getByRole('button',{name,exact:true})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'IL',exact:true}));fireEvent.change(screen.getByRole('textbox',{name:'Destination IL'}),{target:{value:'il02a1'}});fireEvent.click(screen.getByRole('button',{name:'Save redirect',exact:true}));
  await waitFor(()=>{if(!onSave.calls.any())throw new Error('Waiting for IL validation: '+(screen.queryByRole('alert')?.textContent||''));});expect(onSave).toHaveBeenCalledWith({kind:'il',il:'IL02A1'} as CloudRedirect,undefined);await waitFor(()=>{if(!onClose.calls.any())throw new Error('Waiting for redirect save');});
 });
 it('shows a useful lookup error without losing the entered IL',async()=>{
  spyOn(globalThis,'fetch').and.resolveTo(new Response(JSON.stringify({error:'This IL isn’t available.'}),{status:404}));
  render(<MemoryRouter><CloudILSearch onClose={()=>{}}/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'IL',exact:true}));fireEvent.change(screen.getByRole('textbox',{name:'Search IL'}),{target:{value:'IL099'}});fireEvent.click(screen.getByRole('button',{name:'Search',exact:true}));await waitFor(()=>expect(screen.getByRole('alert').textContent).toBe('This IL isn’t available.'));expect((screen.getByRole('textbox',{name:'Search IL'}) as HTMLInputElement).value).toBe('IL099');
 });
 it('offers the matching name and immutable IL together in search results',async()=>{
  spyOn(globalThis,'fetch').and.callFake(async(_url,init)=>{expect(JSON.parse(String(init?.body))).toEqual({action:'search',query:'Ocean',page:0});return new Response(JSON.stringify({items:[{id:'ocean',name:'Ocean',il:'IL021',scope:'public',url:'/?cloud=ocean&space=public'}],page:0,pages:1,total:1}));});
  render(<MemoryRouter><CloudILSearch onClose={()=>{}}/></MemoryRouter>);fireEvent.change(screen.getByRole('textbox',{name:'Search cloud names'}),{target:{value:'Ocean'}});fireEvent.click(screen.getByRole('button',{name:'Search',exact:true}));await waitFor(()=>expect(screen.getByRole('button',{name:'Ocean IL021'})).toBeTruthy());
 });
});
