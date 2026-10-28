import React from 'react';
import { render,fireEvent,cleanup,act } from '@testing-library/react';
import { CloudColorWheel } from '../components/CloudColorWheel';
import { CloudComposer } from '../components/CloudComposer';
import { colorHex,colorHue } from './cloudColors';
describe('Gradient color control',()=>{
 afterEach(cleanup);
 it('exposes one named keyboard slider instead of a preset list',()=>{
  const change=jasmine.createSpy('color'),view=render(<CloudColorWheel value="blue" onChange={change} usedColors={['blue']}/>);
  const slider=view.getByRole('slider',{name:'Word color'});expect(view.queryAllByRole('radio').length).toBe(0);expect(slider.getAttribute('aria-valuetext')).toBe('Blue');
  fireEvent.keyDown(slider,{key:'ArrowRight'});expect(change).toHaveBeenCalled();expect(colorHex(change.calls.mostRecent().args[0])).not.toBe(colorHex('blue'));
 });
 it('disables selection during a save',()=>{const change=jasmine.createSpy('color'),view=render(<CloudColorWheel value="blue" onChange={change} disabled/>);fireEvent.keyDown(view.getByRole('slider'),{key:'ArrowRight'});expect(change).not.toHaveBeenCalled();});
 it('retains a failed colored draft and advances to a new shade after success',async()=>{
  const add=jasmine.createSpy('add').and.resolveTo(false),draft=()=>{};
  const view=render(<CloudComposer scope="chess" colors parentId="boards" busy={false} disabled={false} draft={{name:'New',color:'blue'}} onDraft={draft} onAdd={add} usedColors={['blue']}/>);
  const form=view.getByRole('form',{name:'Add to this cloud'});
  await act(async()=>{fireEvent.submit(form);});const first=add.calls.mostRecent().args[0];expect(colorHex(first.color)).not.toBe(colorHex('blue'));
  add.and.resolveTo(true);await act(async()=>{fireEvent.submit(form);});expect(add.calls.mostRecent().args[0].id).toBe(first.id);
  fireEvent.change(view.getByLabelText('Add a word or name your file'),{target:{value:'Another'}});await act(async()=>{fireEvent.submit(form);});
  expect(colorHex(add.calls.mostRecent().args[0].color)).not.toBe(colorHex(first.color));
 });
});

describe('Color wheel entry visibility',()=>{
 let originalEvent:typeof Event;
 beforeEach(()=>{originalEvent=globalThis.Event;globalThis.Event=window.Event;});
 afterEach(()=>{cleanup();globalThis.Event=originalEvent;});
 it('is hidden until word entry starts and stays available when focus moves into the picker',()=>{
  const view=render(<CloudComposer colors parentId="private" busy={false} disabled={false} draft={{name:''}} onDraft={()=>{}} onAdd={async()=>true}/>),input=view.getByLabelText('Add a word or name your file');
  expect(view.queryByRole('slider')).toBeNull();fireEvent.focus(input);const slider=view.getByRole('slider',{name:'Word color'});expect(slider).toBeTruthy();fireEvent.blur(input,{relatedTarget:slider});expect(view.queryByRole('slider')).toBeTruthy();fireEvent.blur(slider,{relatedTarget:document.body});expect(view.queryByRole('slider')).toBeNull();
 });
 it('keeps the draft and chosen color when entry is dismissed',()=>{
  const view=render(<CloudComposer colors parentId="public" scope="public" busy={false} disabled={false} draft={{name:'Keep me',color:'blue'}} onDraft={()=>{}} onAdd={async()=>false}/>),input=view.getByLabelText('Add a word or name your file') as HTMLInputElement;
  fireEvent.focus(input);const original=view.getByRole('slider').getAttribute('aria-valuetext');fireEvent.keyDown(view.getByRole('slider'),{key:'ArrowRight'});const chosen=view.getByRole('slider').getAttribute('aria-valuetext');expect(chosen).not.toBe(original);fireEvent.blur(input,{relatedTarget:document.body});expect(view.queryByRole('slider')).toBeNull();expect(input.value).toBe('Keep me');fireEvent.focus(input);expect(view.getByRole('slider').getAttribute('aria-valuetext')).toBe(chosen);
 });
});

describe('Random word color',()=>{
 let originalEvent:typeof Event;
 beforeEach(()=>{originalEvent=globalThis.Event;globalThis.Event=window.Event;localStorage.removeItem('ion.word-color.random');});
 afterEach(()=>{cleanup();localStorage.removeItem('ion.word-color.random');globalThis.Event=originalEvent;});
 it('keeps a manual override for the current entry, retries it unchanged and randomizes the next entry',async()=>{
  localStorage.setItem('ion.word-color.random','true');
  const add=jasmine.createSpy('add').and.resolveTo(false),view=render(<CloudComposer colors scope="chess" parentId="boards" busy={false} disabled={false} draft={{name:'First'}} onDraft={()=>{}} onAdd={add}/>);
  const input=view.getByLabelText('Add a word or name your file');fireEvent.focus(input);
  fireEvent.keyDown(view.getByRole('slider'),{key:'w'});
  const form=view.getByRole('form');await act(async()=>{fireEvent.submit(form);});
  const first=add.calls.mostRecent().args[0];expect(first.color).toBe('white');
  add.and.resolveTo(true);await act(async()=>{fireEvent.submit(form);});expect(add.calls.mostRecent().args[0]).toEqual(first);
  fireEvent.change(input,{target:{value:'Second'}});await act(async()=>{fireEvent.submit(form);});
  expect(colorHex(add.calls.mostRecent().args[0].color)).not.toBe(colorHex('white'));
 });
 it('places the palette after the input and starts with distinct paint colors',()=>{const view=render(<CloudComposer colors scope="chess" parentId="boards" busy={false} disabled={false} draft={{name:'First'}} onDraft={()=>{}} onAdd={async()=>true}/>),input=view.getByLabelText('Add a word or name your file');fireEvent.focus(input);const wheel=view.getByRole('slider');expect(input.compareDocumentPosition(wheel)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(wheel.getAttribute('aria-valuetext')).not.toBe('White');});
 it('uses a new paint when the first droplet opens another cloud',()=>{const props={colors:true,scope:'chess' as const,busy:false,disabled:false,onDraft:()=>{},onAdd:async()=>true};const view=render(<CloudComposer {...props} parentId="first" storageKey="first" draft={{name:''}}/>),input=view.getByLabelText('Add a word or name your file');fireEvent.focus(input);const before=Number((view.getByRole('slider').getAttribute('aria-valuenow')));view.rerender(<CloudComposer {...props} parentId="second" storageKey="second" draft={{name:''}}/>);const after=Number((view.getByRole('slider').getAttribute('aria-valuenow')));const gap=Math.abs(after-before);expect(Math.min(gap,360-gap)).toBeGreaterThan(30);expect(view.getByRole('slider').getAttribute('aria-valuetext')).not.toBe('White');});
 it('does not reuse paint after a fast successful send',async()=>{const add=jasmine.createSpy('add').and.resolveTo(true),view=render(<CloudComposer colors scope="chess" parentId="boards" busy={false} disabled={false} draft={{name:'First'}} onDraft={()=>{}} onAdd={add}/>),form=view.getByRole('form'),input=view.getByLabelText('Add a word or name your file');await act(async()=>{fireEvent.submit(form);});const first=add.calls.mostRecent().args[0];fireEvent.change(input,{target:{value:'Second'}});await act(async()=>{fireEvent.submit(form);});const second=add.calls.mostRecent().args[0],gap=Math.abs(colorHue(first.color)-colorHue(second.color));expect(colorHex(second.color)).not.toBe(colorHex(first.color));expect(Math.min(gap,360-gap)).toBeGreaterThan(30);});
});
