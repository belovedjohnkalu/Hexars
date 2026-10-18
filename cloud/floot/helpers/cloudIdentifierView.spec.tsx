import React from 'react';
import { render,cleanup,act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CloudCanvas } from '../components/CloudCanvas';
describe('Owner identifier visibility',()=>{
 let fonts:PropertyDescriptor|undefined;
 beforeEach(()=>{fonts=Object.getOwnPropertyDescriptor(document,'fonts');Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve()}});});
 afterEach(()=>{cleanup();if(fonts)Object.defineProperty(document,'fonts',fonts);else delete (document as unknown as {fonts?:unknown}).fonts;});
 it('requires the explicit owner view and removes the label immediately when it is lost',async()=>{
  const props={nodes:[{id:'word',parentId:'public',name:'A word',identifier:'IL10'}],scope:'public' as const,parentId:'public',onOpen:()=>{},opening:null,loading:false};
  const view=render(<MemoryRouter><CloudCanvas {...props}/></MemoryRouter>);await act(async()=>{await Promise.resolve();});
  expect(view.queryByText('IL10')).toBeNull();
  view.rerender(<MemoryRouter><CloudCanvas {...props} showIdentifiers/></MemoryRouter>);
  expect(view.getByText('IL10').getAttribute('data-identifier')).toBe('IL10');expect(view.getByRole('link',{name:'A word'}).getAttribute('aria-description')).toContain('IL10');
  view.rerender(<MemoryRouter><CloudCanvas {...props} showIdentifiers={false}/></MemoryRouter>);
  expect(view.queryByText('IL10')).toBeNull();expect(view.getByRole('link',{name:'A word'}).getAttribute('aria-description')).not.toContain('IL10');
 });
});
