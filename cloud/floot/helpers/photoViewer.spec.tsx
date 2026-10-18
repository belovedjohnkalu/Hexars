import React from 'react';
import { render,cleanup,fireEvent,act } from '@testing-library/react';
import { CloudPhotoViewer } from '../components/CloudPhotoViewer';
describe('Fullscreen collage photos',()=>{
 let oldEvent:typeof Event,oldCustom:typeof CustomEvent;
 beforeEach(()=>{oldEvent=globalThis.Event;oldCustom=globalThis.CustomEvent;globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;});
 afterEach(async()=>{await act(async()=>{cleanup();await new Promise(r=>setTimeout(r,0));});globalThis.Event=oldEvent;globalThis.CustomEvent=oldCustom;});
 it('fills the viewport rather than using a centered-sheet offset and navigates every picture',()=>{const view=render(<CloudPhotoViewer node={{id:'album',parentId:'private',name:'Album',imageUrls:['one.png','two.png']}} onClose={()=>{}}/>),dialog=view.getByRole('dialog');expect(dialog.style.top).toBe('0px');expect(dialog.style.height).toBe((window.innerHeight||innerHeight)+'px');expect(view.getByRole('img').getAttribute('src')).toBe('one.png');fireEvent.click(view.getByRole('button',{name:'Next photo'}));expect(view.getByRole('img').getAttribute('src')).toBe('two.png');expect((view.getByRole('button',{name:'Next photo'}) as HTMLButtonElement).disabled).toBeTrue();fireEvent.click(view.getByRole('button',{name:'Previous photo'}));expect(view.getByRole('img').getAttribute('src')).toBe('one.png');});
});
