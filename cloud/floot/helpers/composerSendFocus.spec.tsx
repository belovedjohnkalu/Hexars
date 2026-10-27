import React,{useState} from 'react';
import { render,fireEvent,cleanup,act } from '@testing-library/react';
import { CloudComposer } from '../components/CloudComposer';
describe('Send without dismissing typing',()=>{
 let oldEvent:typeof Event;
 beforeEach(()=>{oldEvent=globalThis.Event;globalThis.Event=window.Event;});
 afterEach(()=>{cleanup();globalThis.Event=oldEvent;});
 for(const success of [true,false])it('keeps focus through a '+(success?'successful':'failed')+' pending send',async()=>{
  let finish:(value:boolean)=>void=()=>{};const pending=new Promise<boolean>(resolve=>{finish=resolve;}),sent=jasmine.createSpy('sent');
  function Example(){const [busy,setBusy]=useState(false);return <CloudComposer parentId="private" colors busy={busy} disabled={false} draft={{name:'Draft'}} onDraft={()=>{}} onAdd={async value=>{sent(value);setBusy(true);const result=await pending;setBusy(false);return result;}}/>;}
  const view=render(<Example/>),input=view.getByLabelText('Add a word or name your file') as HTMLInputElement,button=view.getByRole('button',{name:'Add',exact:true});input.focus();
  const down=new window.MouseEvent('pointerdown',{bubbles:true,cancelable:true,button:0});button.dispatchEvent(down);expect(down.defaultPrevented).toBeTrue();
  await act(async()=>{fireEvent.submit(view.getByRole('form'));});expect(sent.calls.count()).toBe(1);expect(input.readOnly).toBeFalse();expect(document.activeElement).toBe(input);expect(view.getByRole('button',{name:'Saving',exact:true}).hasAttribute('disabled')).toBeTrue();
  await act(async()=>{fireEvent.submit(view.getByRole('form'));});expect(sent.calls.count()).toBe(1);
  await act(async()=>{finish(success);});expect(document.activeElement).toBe(input);expect(input.value).toBe(success?'':'Draft');
 });
});
