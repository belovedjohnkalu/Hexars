import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {TileName} from '../components/TileName';
describe('Tile title gestures',()=>{
 let actions:string[],listener:(e:Event)=>void;
 beforeEach(()=>{jasmine.clock().install();actions=[];listener=e=>actions.push((e as CustomEvent).detail.action);window.addEventListener('ion.page-action',listener);});afterEach(()=>{cleanup();window.removeEventListener('ion.page-action',listener);jasmine.clock().uninstall();});
 it('opens direct Rename on a double tap without also opening the overview',()=>{const view=render(<TileName name="Ideas"/>),title=view.getByRole('button',{name:'Sky: Ideas'});fireEvent.click(title,{detail:1});act(()=>jasmine.clock().tick(50));fireEvent.click(title,{detail:2});fireEvent.dblClick(title);act(()=>jasmine.clock().tick(400));expect(actions).toEqual(['tile-rename-direct']);});
 it('opens the overview for one tap and supports direct keyboard renaming',()=>{const view=render(<TileName name="Ideas"/>),title=view.getByRole('button');fireEvent.click(title,{detail:1});act(()=>jasmine.clock().tick(321));expect(actions).toEqual(['tiles']);fireEvent.keyDown(title,{key:'F2'});expect(actions).toEqual(['tiles','tile-rename-direct']);});
 it('cancels a pending tap if its title is removed',()=>{const view=render(<TileName name="Ideas"/>);fireEvent.click(view.getByRole('button'),{detail:1});view.unmount();act(()=>jasmine.clock().tick(400));expect(actions).toEqual([]);});
});
