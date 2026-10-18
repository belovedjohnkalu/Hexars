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
 it('disables selection during a save',()=>{const change=jasmine.createSpy('color'),view=render(<CloudColorWheel value="blue" onChange={change} disabled/>);fireEvent.keyDown(view.getByRole('slider'),{key:'ArrowRight'});expect(change).not.toHaveBeenCalled();});
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
