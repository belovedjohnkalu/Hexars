import React from 'react';
import {render,fireEvent,cleanup,act} from '@testing-library/react';
import {readTiledUI,setTiledUI,useTiledUI,LayoutSync,layoutCloud,layoutWords} from './useTiledUI';
function Choice(){const tiled=useTiledUI();return <button aria-pressed={tiled} onClick={()=>setTiledUI(!tiled)}>Toggle Tiled UI</button>;}
describe('Organic default and explicit tiled preference',()=>{
 beforeEach(()=>{setTiledUI(false);localStorage.removeItem('ion.layout.tiled');});
 afterEach(()=>{cleanup();setTiledUI(false);});
 it('defaults to organic independently of a saved dark preference',()=>{localStorage.setItem('ion.appearance.dark','true');expect(readTiledUI()).toBeFalse();const view=render(<><LayoutSync/><Choice/></>);expect(view.getByRole('button').getAttribute('aria-pressed')).toBe('false');expect(document.documentElement.dataset.ionLayout).toBe('organic');localStorage.removeItem('ion.appearance.dark');});
 it('updates every subscriber and preserves the explicit choice for another mount',()=>{const view=render(<><LayoutSync/><Choice/><Choice/></>);fireEvent.click(view.getAllByRole('button')[0]);expect(view.getAllByRole('button').every(n=>n.getAttribute('aria-pressed')==='true')).toBeTrue();expect(localStorage.getItem('ion.layout.tiled')).toBe('true');view.unmount();expect(render(<Choice/>).getByRole('button').getAttribute('aria-pressed')).toBe('true');});
 it('follows storage changes from another same-origin page',()=>{const view=render(<Choice/>);act(()=>{localStorage.setItem('ion.layout.tiled','true');window.dispatchEvent(new window.StorageEvent('storage',{key:'ion.layout.tiled',newValue:'true'}));});expect(view.getByRole('button').getAttribute('aria-pressed')).toBe('true');});
 it('continues toggling when device storage is unavailable',()=>{spyOn(Storage.prototype,'setItem').and.throwError('Storage blocked');spyOn(Storage.prototype,'getItem').and.throwError('Storage blocked');const view=render(<Choice/>);fireEvent.click(view.getByRole('button'));expect(readTiledUI()).toBeTrue();fireEvent.click(view.getByRole('button'));expect(readTiledUI()).toBeFalse();});
 it('changes default vocabulary without changing identities or dev-edited names',()=>{const n={id:'page-tiles',name:'Tiles',parentId:'controls',identifier:'IL0042'};expect(layoutCloud(n,false)).toEqual({...n,name:'Skies'});expect(layoutCloud(n,true)).toBe(n);const edited={...n,name:'My views'};expect(layoutCloud(edited,false)).toBe(edited);expect(layoutWords(false).partition).toBe('Screen');expect(layoutWords(true).partition).toBe('Partition');});
});
