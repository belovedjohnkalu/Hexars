import React from 'react';
import { render,fireEvent,cleanup,act } from '@testing-library/react';
import { CloudColorWheel } from '../components/CloudColorWheel';
import { CloudComposer } from '../components/CloudComposer';
import { colorHex } from './cloudColors';
describe('Gradient color control',()=>{
 afterEach(cleanup);
 it('exposes one named keyboard slider instead of a preset list',()=>{
  const change=jasmine.createSpy('color'),view=render(<CloudColorWheel value="blue" onChange={change} usedColors={['blue']}/>);
  const slider=view.getByRole('slider',{name:'Word color'});expect(view.queryAllByRole('radio').length).toBe(0);expect(slider.getAttribute('aria-valuetext')).toBe('Blue');
  fireEvent.keyDown(slider,{key:'ArrowRight'});expect(change).toHaveBeenCalled();expect(colorHex(change.calls.mostRecent().args[0])).not.toBe(colorHex('blue'));
 });
 it('disables selection during a save',()=>{const change=jasmine.createSpy('color'),view=render(<CloudColorWheel value="blue" onChange={change} disabled/>);fireEvent.keyDown(view.getByRole('slider',{name:'Word color'}),{key:'ArrowRight'});expect(change).not.toHaveBeenCalled();});
 it('retains a failed colored draft and advances to a new shade after success',async()=>{
  const add=jasmine.createSpy('add').and.resolveTo(false),draft=()=>{};
  const view=render(<CloudComposer scope="chess" colors parentId="boards" busy={false} disabled={false} draft={{name:'New',color:'blue'}} onDraft={draft} onAdd={add} usedColors={['blue']}/>);
  const form=view.getByRole('form',{name:'Add to this cloud'});
  await act(async()=>{fireEvent.submit(form);});const first=add.calls.mostRecent().args[0];expect(colorHex(first.color)).not.toBe(colorHex('blue'));
  add.and.resolveTo(true);await act(async()=>{fireEvent.submit(form);});expect(add.calls.mostRecent().args[0].id).toBe(first.id);
  fireEvent.change(view.getByLabelText('Add a word or a picture name'),{target:{value:'Another'}});await act(async()=>{fireEvent.submit(form);});
  expect(colorHex(add.calls.mostRecent().args[0].color)).not.toBe(colorHex(first.color));
 });
});

describe('Color wheel entry visibility',()=>{
 let originalEvent:typeof Event;
 beforeEach(()=>{originalEvent=globalThis.Event;globalThis.Event=window.Event;});
 afterEach(()=>{cleanup();globalThis.Event=originalEvent;});
 it('is hidden until word entry starts and stays available when focus moves into the picker',()=>{
  const view=render(<CloudComposer colors parentId="private" busy={false} disabled={false} draft={{name:''}} onDraft={()=>{}} onAdd={async()=>true}/>),input=view.getByLabelText('Add a word or a picture name');
  expect(view.queryByRole('slider',{name:'Word color'})).toBeNull();fireEvent.focus(input);const slider=view.getByRole('slider',{name:'Word color'});expect(slider).toBeTruthy();fireEvent.blur(input,{relatedTarget:slider});expect(view.queryByRole('slider',{name:'Word color'})).toBeTruthy();fireEvent.blur(slider,{relatedTarget:document.body});expect(view.queryByRole('slider',{name:'Word color'})).toBeNull();
 });
 it('keeps the draft and chosen color when entry is dismissed',()=>{
  const view=render(<CloudComposer colors parentId="public" scope="public" busy={false} disabled={false} draft={{name:'Keep me',color:'blue'}} onDraft={()=>{}} onAdd={async()=>false}/>),input=view.getByLabelText('Add a word or a picture name') as HTMLInputElement;
  fireEvent.focus(input);const original=view.getByRole('slider',{name:'Word color'}).getAttribute('aria-valuetext');fireEvent.keyDown(view.getByRole('slider',{name:'Word color'}),{key:'ArrowRight'});const chosen=view.getByRole('slider',{name:'Word color'}).getAttribute('aria-valuetext');expect(chosen).not.toBe(original);fireEvent.blur(input,{relatedTarget:document.body});expect(view.queryByRole('slider',{name:'Word color'})).toBeNull();expect(input.value).toBe('Keep me');fireEvent.focus(input);expect(view.getByRole('slider',{name:'Word color'}).getAttribute('aria-valuetext')).toBe(chosen);
 });
});

describe('Random word color',()=>{
 let originalEvent:typeof Event;
 beforeEach(()=>{originalEvent=globalThis.Event;globalThis.Event=window.Event;localStorage.removeItem('ion.word-color.random');});
 afterEach(()=>{cleanup();localStorage.removeItem('ion.word-color.random');globalThis.Event=originalEvent;});
 it('keeps a manual override for the current entry, retries it unchanged and randomizes the next entry',async()=>{
  localStorage.setItem('ion.word-color.random','true');
  const add=jasmine.createSpy('add').and.resolveTo(false),view=render(<CloudComposer colors scope="chess" parentId="boards" busy={false} disabled={false} draft={{name:'First'}} onDraft={()=>{}} onAdd={add}/>);
  const input=view.getByLabelText('Add a word or a picture name');fireEvent.focus(input);
  fireEvent.keyDown(view.getByRole('slider',{name:'Word color'}),{key:'w'});
  const form=view.getByRole('form');await act(async()=>{fireEvent.submit(form);});
  const first=add.calls.mostRecent().args[0];expect(first.color).toBe('white');
  add.and.resolveTo(true);await act(async()=>{fireEvent.submit(form);});expect(add.calls.mostRecent().args[0]).toEqual(first);
  fireEvent.change(input,{target:{value:'Second'}});await act(async()=>{fireEvent.submit(form);});
  expect(colorHex(add.calls.mostRecent().args[0].color)).not.toBe(colorHex('white'));
 });
});
