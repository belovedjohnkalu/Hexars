import {tileName,tileWeight,tileOverviewItems,type OpenTile} from './pageTiles';
import {cloudLayout} from './cloudLayout';
import {splitPage} from './pageWorkspace';

const single:OpenTile={id:0,number:1,primary:0,focus:0,tree:{screen:0},screens:[{id:0,url:'/',label:'A large page',characters:1000000}]};
const double:OpenTile={id:1,number:2,primary:1,focus:1,tree:splitPage({screen:1},1,2,'right'),screens:[{id:1,url:'/',label:'A',characters:1},{id:2,url:'/',label:'B',characters:1}]};
const measure=(text:string,size:number)=>text.length*size*.5;

describe('Tiled overview',()=>{
 it('uses content weight while retaining permanent tile identity',()=>{
  expect(tileWeight(single)).toBe(1000000);
  expect(tileWeight(double)).toBe(2);
  const cards=tileOverviewItems([single,double]);
  expect(cards.map(card=>card.id)).toEqual(['open-tile-0','open-tile-1']);
  expect(cards[0].characters).toBeGreaterThan(cards[1].characters);
 });
 it('keeps custom names and complete rhombus faces',()=>{
  expect(tileName(single)).toBe('Tile 1');
  expect(tileName({...single,name:'Work'})).toBe('Work');
  const out=cloudLayout(tileOverviewItems([single,double]),520,520,measure,{rhombi:true});
  expect(out.items).toHaveSize(2);
  expect(out.items.every(item=>!!item.rhombus)).toBeTrue();
 });
});
