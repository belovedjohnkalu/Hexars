import React from 'react';
import { render,fireEvent,cleanup,act } from '@testing-library/react';
import { SpatialViewport } from '../components/SpatialViewport';
describe('Spatial camera lifecycle',()=>{
 afterEach(cleanup);
 it('waits for content readiness and never refits after deletion or a background refresh',()=>{
  const props={width:900,height:900,viewKey:'camera-'+crypto.randomUUID(),initialZoom:1};
  const view=render(<SpatialViewport {...props} ready={false}><a href="#a">Word</a></SpatialViewport>);
  view.rerender(<SpatialViewport {...props} ready><a href="#a">Word</a></SpatialViewport>);
  const world=view.container.querySelector('[data-camera-zoom]') as HTMLElement;const before=world.style.transform;
  view.rerender(<SpatialViewport {...props} width={700} height={700} ready><a href="#b">Survivor</a></SpatialViewport>);
  expect(world.style.transform).toBe(before);expect(world.dataset.cameraZoom).toBe('1');
 });
 it('keeps a panned camera when content changes and still supports explicit keyboard reset',()=>{
  const props={width:900,height:900,viewKey:'camera-'+crypto.randomUUID(),initialZoom:1};
  const view=render(<SpatialViewport {...props}><a href="#a">Word</a></SpatialViewport>),region=view.getByRole('region',{name:'Word space'}),world=view.container.querySelector('[data-camera-zoom]') as HTMLElement;
  fireEvent.keyDown(region,{key:'ArrowDown'});const before=world.style.transform;
  view.rerender(<SpatialViewport {...props} height={1200}><a href="#b">Survivor</a></SpatialViewport>);expect(world.style.transform).toBe(before);
  fireEvent.keyDown(region,{key:'0'});expect(world.style.transform).not.toBe(before);
 });
 it('refits explicitly resized layouts while keeping content-only updates steady',()=>{
  const props={width:900,height:900,viewKey:'resize-'+crypto.randomUUID(),initialZoom:1};
  const view=render(<SpatialViewport {...props} refitKey="393:682">Word</SpatialViewport>),world=view.container.querySelector('[data-camera-zoom]') as HTMLElement,before=world.style.transform;
  view.rerender(<SpatialViewport {...props} width={1200} refitKey="1280:682">Word</SpatialViewport>);expect(world.style.transform).not.toBe(before);
  const resized=world.style.transform;view.rerender(<SpatialViewport {...props} width={1000} refitKey="1280:682">Survivor</SpatialViewport>);expect(world.style.transform).toBe(resized);
 });

});

describe('Occupied-content opening frame',()=>{
 it('fills the viewport using occupied bounds rather than the empty world and keeps subsequent panning',()=>{
  const width=spyOnProperty(HTMLElement.prototype,'clientWidth','get').and.returnValue(390),height=spyOnProperty(HTMLElement.prototype,'clientHeight','get').and.returnValue(700);
  const props={width:2000,height:2000,viewKey:'bounds-'+crypto.randomUUID(),contentBounds:{x:800,y:850,width:400,height:200}};
  const v=render(<SpatialViewport {...props}>Words</SpatialViewport>),world=v.container.querySelector('[data-camera-zoom]') as HTMLElement;
  expect(Number(world.dataset.cameraZoom)).toBeCloseTo(.925,5);
  fireEvent.keyDown(v.getByRole('region'),{key:'ArrowLeft'});const camera=world.style.transform;
  v.rerender(<SpatialViewport {...props} contentBounds={{x:500,y:500,width:1000,height:1000}}>More words</SpatialViewport>);expect(world.style.transform).toBe(camera);cleanup();
 });
});


describe('Touch opening scale',()=>{
 afterEach(cleanup);
 it('keeps a minimum opening scale while permitting manual zoom out and cached views',()=>{
  spyOnProperty(HTMLElement.prototype,'clientWidth','get').and.returnValue(390);spyOnProperty(HTMLElement.prototype,'clientHeight','get').and.returnValue(700);
  const props={width:2000,height:2000,viewKey:'touch-'+crypto.randomUUID(),contentBounds:{x:0,y:0,width:1800,height:1800},minFitZoom:.8};
  const v=render(<SpatialViewport {...props}>Words</SpatialViewport>),world=v.container.querySelector('[data-camera-zoom]') as HTMLElement;
  expect(Number(world.dataset.cameraZoom)).toBe(.8);fireEvent.keyDown(v.getByRole('region'),{key:'-'});const zoom=Number(world.dataset.cameraZoom);expect(zoom).toBeLessThan(.8);
  v.unmount();const next=render(<SpatialViewport {...props}>Words</SpatialViewport>);expect(Number((next.container.querySelector('[data-camera-zoom]') as HTMLElement).dataset.cameraZoom)).toBeCloseTo(zoom,8);
 });
 it('preserves an explicit initial zoom independently of the touch fit floor',()=>{
  spyOnProperty(HTMLElement.prototype,'clientWidth','get').and.returnValue(390);spyOnProperty(HTMLElement.prototype,'clientHeight','get').and.returnValue(700);
  const v=render(<SpatialViewport width={2000} height={2000} viewKey={'explicit-'+crypto.randomUUID()} minFitZoom={.8} initialZoom={.3}>Words</SpatialViewport>);
  expect(Number((v.container.querySelector('[data-camera-zoom]') as HTMLElement).dataset.cameraZoom)).toBe(.3);
 });
});
