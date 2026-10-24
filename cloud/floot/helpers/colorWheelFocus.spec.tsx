import React,{useState} from 'react';
import { render,fireEvent,cleanup,act } from '@testing-library/react';
import { CloudColorWheel } from '../components/CloudColorWheel';
import { Input } from '../components/Input';
import type { CloudColor } from './cloudColors';
function Example({disabled=false}:{disabled?:boolean}){const [color,setColor]=useState<CloudColor>('white');return <form noValidate><Input aria-label="Word" defaultValue="A draft"/><CloudColorWheel value={color} onChange={setColor} disabled={disabled}/><output data-testid="color">{color}</output></form>;}
function pointer(element:Element,type:string,x:number,id=1){const event=new window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,button:0});Object.defineProperties(event,{pointerId:{value:id},pointerType:{value:'touch'}});fireEvent(element,event);}
describe('Color wheel typing focus',()=>{
 const originalEvent=globalThis.Event,originalCustomEvent=globalThis.CustomEvent;
 beforeEach(()=>{globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;});
 afterEach(()=>{cleanup();globalThis.Event=originalEvent;globalThis.CustomEvent=originalCustomEvent;});
 function mount(disabled=false){const view=render(<Example disabled={disabled}/>),input=view.getByLabelText('Word') as HTMLInputElement,thumb=view.getByRole('slider'),root=view.container.querySelector('[data-color-wheel] > [data-orientation]') as HTMLElement;root.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:300,bottom:44,width:300,height:44,toJSON:()=>({})});let captured=false;root.setPointerCapture=()=>{captured=true;};root.hasPointerCapture=()=>captured;root.releasePointerCapture=()=>{captured=false;};return {view,input,thumb,root};}
 it('changes color without blurring the active draft or moving its selection',()=>{
  const {view,input,root}=mount(),blur=jasmine.createSpy('blur');input.addEventListener('blur',blur);input.focus();input.setSelectionRange(2,5);const initial=view.getByTestId('color').textContent;
  pointer(root,'pointerdown',60);pointer(root,'pointermove',250);pointer(root,'pointerup',250);
  expect(view.getByTestId('color').textContent).not.toBe(initial);expect(document.activeElement).toBe(input);expect(blur).not.toHaveBeenCalled();expect(input.selectionStart).toBe(2);expect(input.selectionEnd).toBe(5);expect(input.value).toBe('A draft');
 });
 it('retains arrow-key operation when the slider is intentionally focused',()=>{
  const {view,thumb}=mount();thumb.focus();const initial=view.getByTestId('color').textContent;fireEvent.keyDown(thumb,{key:'ArrowRight'});expect(view.getByTestId('color').textContent).not.toBe(initial);expect(document.activeElement).toBe(thumb);
 });
 it('does not change color when disabled and recovers after pointer cancellation',()=>{
  const first=mount(true);first.input.focus();const initial=first.view.getByTestId('color').textContent;pointer(first.root,'pointerdown',250);expect(first.view.getByTestId('color').textContent).toBe(initial);cleanup();
  const {view,input,root}=mount();input.focus();pointer(root,'pointerdown',50);pointer(root,'pointercancel',50);const value=view.getByTestId('color').textContent;pointer(root,'pointermove',250);expect(view.getByTestId('color').textContent).toBe(value);pointer(root,'pointerdown',250,2);pointer(root,'pointerup',250,2);expect(view.getByTestId('color').textContent).not.toBe(value);expect(document.activeElement).toBe(input);
 });
 it('selects white on a stationary hold and keeps it after release or continued movement',async()=>{
  const {view,input,root}=mount();input.focus();pointer(root,'pointerdown',60);pointer(root,'pointerup',60);
  expect(view.getByTestId('color').textContent).not.toBe('white');
  await act(async()=>{pointer(root,'pointerdown',90);await new Promise(resolve=>setTimeout(resolve,330));});
  expect(view.getByTestId('color').textContent).toBe('white');pointer(root,'pointermove',240);pointer(root,'pointerup',240);expect(view.getByTestId('color').textContent).toBe('white');expect(document.activeElement).toBe(input);
 });
 it('offers white through W without taking focus from the slider',()=>{
  const {view,thumb}=mount();thumb.focus();fireEvent.keyDown(thumb,{key:'ArrowRight'});fireEvent.keyDown(thumb,{key:'w'});expect(view.getByTestId('color').textContent).toBe('white');expect(document.activeElement).toBe(thumb);
 });

});
