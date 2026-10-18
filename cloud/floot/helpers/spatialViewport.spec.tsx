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
