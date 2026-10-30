import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {useCloudDrag} from './useCloudDrag';
import type {CloudNode} from '../endpoints/cloud_POST.schema';

const source:CloudNode={id:'source',parentId:'root',name:'Source',canEdit:true};
const target:CloudNode={id:'target',parentId:'root',name:'Target',canEdit:true};
function Fixture({enabled,drop,pan}:{enabled:boolean;drop:(a:CloudNode,b:CloudNode)=>Promise<boolean>;pan:()=>void}){
 const drag=useCloudDrag([source,target],enabled?drop:undefined,()=>{});
 return <div onPointerDown={pan}><span data-node-id="source" {...drag.handlers(source)}>Source</span><span data-node-id="target">Target</span></div>;
}
function pointer(element:Element,type:string,x:number){const event=new window.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:20});Object.defineProperty(event,'pointerId',{value:1});fireEvent(element,event);}
describe('Cloud dragging availability',()=>{
 afterEach(cleanup);
 it('does not start a drag when disabled and lets the canvas receive the gesture',()=>{
  const drop=jasmine.createSpy('drop').and.resolveTo(true),pan=jasmine.createSpy('pan'),view=render(<Fixture enabled={false} drop={drop} pan={pan}/>),word=view.getByText('Source');
  pointer(word,'pointerdown',10);pointer(word,'pointermove',80);pointer(word,'pointerup',80);
  expect(pan).toHaveBeenCalled();expect(drop).not.toHaveBeenCalled();expect(word.hasAttribute('data-dragging')).toBeFalse();
 });
 it('keeps desktop drag-to-move working',async()=>{
  const drop=jasmine.createSpy('drop').and.resolveTo(true),view=render(<Fixture enabled drop={drop} pan={()=>{}}/>),word=view.getByText('Source'),destination=view.getByText('Target'),old=document.elementFromPoint;
  document.elementFromPoint=()=>destination;
  try{pointer(word,'pointerdown',10);pointer(word,'pointermove',80);expect(word.dataset.dragging).toBe('true');await act(async()=>{pointer(word,'pointerup',80);});expect(drop).toHaveBeenCalledWith(source,target);}finally{document.elementFromPoint=old;}
 });
 it('cancels an uncommitted drag when movement becomes unavailable',()=>{
  const drop=jasmine.createSpy('drop').and.resolveTo(true),view=render(<Fixture enabled drop={drop} pan={()=>{}}/>),word=view.getByText('Source'),old=document.elementFromPoint;document.elementFromPoint=()=>null;
  try{pointer(word,'pointerdown',10);pointer(word,'pointermove',80);expect(word.dataset.dragging).toBe('true');view.rerender(<Fixture enabled={false} drop={drop} pan={()=>{}}/>);expect(word.hasAttribute('data-dragging')).toBeFalse();pointer(word,'pointerup',80);expect(drop).not.toHaveBeenCalled();}finally{document.elementFromPoint=old;}
 });
});
