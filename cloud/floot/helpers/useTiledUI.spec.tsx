import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {readTiledUI,useTiledUI,LayoutSync,layoutCloud,layoutWords} from './useTiledUI';
import {cloudTree} from './cloudTree';
import {tiledUICloudId,interfaceSettingsId} from './interfaceSettingsClouds';

function Choice(){return <output data-layout={useTiledUI()?'tiled':'organic'}/>;}
describe('Tiled-only presentation',()=>{
 afterEach(()=>{cleanup();localStorage.removeItem('ion.layout.tiled');});
 it('uses tiles even when an old device explicitly saved Organic UI',()=>{
  localStorage.setItem('ion.layout.tiled','false');
  expect(readTiledUI()).toBeTrue();
  const view=render(<><LayoutSync/><Choice/></>);
  expect(view.container.querySelector('output')?.dataset.layout).toBe('tiled');
  expect(document.documentElement.dataset.ionLayout).toBe('tiled');
  expect(localStorage.getItem('ion.layout.tiled')).toBeNull();
 });
 it('keeps the Settings cloud and removes the retired toggle',()=>{
  const nodes=cloudTree.forScope('home');
  expect(nodes.find(n=>n.id===interfaceSettingsId)?.parentId).toBe('controls');
  expect(nodes.some(n=>n.id===tiledUICloudId)).toBeFalse();
 });
 it('uses Tile and Partition names without rewriting dev-edited labels',()=>{
  const node={id:'page-tiles',name:'My views',parentId:'controls'};
  expect(layoutCloud(node,false)).toBe(node);
  expect(layoutWords(false).collection).toBe('Tiles');
  expect(layoutWords(false).partition).toBe('Partition');
 });
});
