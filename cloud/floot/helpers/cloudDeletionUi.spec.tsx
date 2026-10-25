import React from 'react';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { CloudActions } from '../components/CloudActions';
import { cloudPolicy } from './cloudPolicy';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Keep-droplets deletion control',()=>{
 const originalEvent=globalThis.Event,originalCustomEvent=globalThis.CustomEvent;
 beforeEach(()=>{globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;});
 afterEach(()=>{cleanup();globalThis.Event=originalEvent;globalThis.CustomEvent=originalCustomEvent;});
 it('offers an explicit choice and submits keeping droplets only after confirmation',async()=>{
 const remove=jasmine.createSpy('remove').and.resolveTo(true),close=jasmine.createSpy('close');
 try{render(<CloudActions node={{id:'a',name:'Folder',parentId:'private'}} nodes={[]} scope="private" version={0} mode="remove" count={2} busy={false} error="" onClose={close} onRename={async()=>true} onRemove={remove} onRelocate={async()=>true} loadTarget={async()=>({nodes:[],version:0})}/>);}catch(error){throw new Error(String((error as AggregateError).errors?.map(e=>String(e)).join(" | ")||error));}
 fireEvent.click(screen.getByRole('button',{name:'Keep droplets',exact:true}));expect(remove).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Keep droplets',exact:true}).getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Delete',exact:true}));await waitFor(()=>{if(!remove.calls.count())throw new Error('Not submitted');});expect(remove.calls.mostRecent().args[1]).toBeTrue();
 });
 it('retains server branch ownership checks for promotion',()=>{
 const nodes:CloudNode[]=[{id:'a',parentId:'public',name:'A',createdBy:1},{id:'b',parentId:'a',name:'B',createdBy:2}];
 expect(()=>cloudPolicy.assert('public',nodes,'a',1,false,true)).toThrowError(/other people/);
 expect(()=>cloudPolicy.assert('public',nodes,'a',1,true,true)).not.toThrow();
 expect(()=>cloudPolicy.assert('private',nodes,'a',null,false,true)).toThrow();
 });
});
