import React from 'react';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {CloudComposer} from '../components/CloudComposer';
describe('Composer continuity across clouds',()=>{
 afterEach(cleanup);
 it('rebinds drafts without replacing or blurring the input and never writes the old draft into the destination',async()=>{const onDraft=jasmine.createSpy('draft'),props={parentId:'one',storageKey:'one',busy:false,disabled:false,draft:{name:'First'},onDraft,onAdd:async()=>true},view=render(<CloudComposer {...props}/>),input=view.getByLabelText('Add a word or name your file') as HTMLInputElement;input.focus();onDraft.calls.reset();view.rerender(<CloudComposer {...props} parentId="two" storageKey="two" draft={{name:'Second'}}/>);await act(async()=>{});expect(view.getByLabelText('Add a word or name your file')).toBe(input);expect(document.activeElement).toBe(input);expect(input.value).toBe('Second');expect(onDraft.calls.allArgs().map(a=>a[0].name)).not.toContain('First');});
 it('does not erase new typing when an earlier enqueue completes',async()=>{let finish:(ok:boolean)=>void=()=>{};const pending=new Promise<boolean>(resolve=>finish=resolve),view=render(<CloudComposer parentId="one" storageKey="one" busy={false} disabled={false} draft={{name:'First'}} onDraft={()=>{}} onAdd={()=>pending}/>),input=view.getByLabelText('Add a word or name your file') as HTMLInputElement;await act(async()=>{fireEvent.submit(view.getByRole('form'));});fireEvent.change(input,{target:{value:'Next'}});await act(async()=>finish(true));expect(input.value).toBe('Next');});
});
