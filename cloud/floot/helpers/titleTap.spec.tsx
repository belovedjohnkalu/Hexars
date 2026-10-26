import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {useTitleRefresh} from './useTitleRefresh';
function Probe(){const title=useTitleRefresh();return <button {...title.handlers} onClick={title.handlers.onClick}>Title</button>;}
function pointer(el:HTMLElement,type:string,x=10,y=10){const event=new window.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y,screenX:x,screenY:y});Object.defineProperties(event,{isPrimary:{value:true},pointerId:{value:1}});fireEvent(el,event);}
describe('Single-tap page title',()=>{
 let actions:string[],menus:number,action:(e:Event)=>void,menu:()=>void;
 beforeEach(()=>{jasmine.clock().install();actions=[];menus=0;action=e=>actions.push((e as CustomEvent).detail.action);menu=()=>menus++;window.addEventListener('ion.page-action',action);window.addEventListener('ion.title-menu',menu);});
 afterEach(()=>{cleanup();window.removeEventListener('ion.page-action',action);window.removeEventListener('ion.title-menu',menu);jasmine.clock().uninstall();});
 function mount(){const view=render(<Probe/>),title=view.getByRole('button');title.setPointerCapture=()=>{};title.hasPointerCapture=()=>false;return title;}
 it('refreshes on the first click without waiting for another tap',()=>{const title=mount();fireEvent.click(title,{detail:1});expect(actions).toEqual(['refresh']);expect(menus).toBe(0);});
 it('also refreshes for native keyboard activation',()=>{const title=mount();fireEvent.click(title,{detail:0});expect(actions).toEqual(['refresh']);});
 it('keeps a held title in screen options and suppresses its release click',()=>{const title=mount();pointer(title,'pointerdown');act(()=>jasmine.clock().tick(180));pointer(title,'pointerup');fireEvent.click(title,{detail:1});expect(menus).toBe(1);expect(actions).toEqual([]);});
 it('does not refresh after a swipe or cancelled gesture',()=>{const title=mount();pointer(title,'pointerdown');pointer(title,'pointerup',90);fireEvent.click(title,{detail:1});expect(actions).toEqual(['split']);pointer(title,'pointerdown');pointer(title,'pointercancel');fireEvent.click(title,{detail:1});expect(actions).toEqual(['split']);});
});
