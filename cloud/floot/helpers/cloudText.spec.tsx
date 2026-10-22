import { cloudText, cloudTextLines, characterLength } from './cloudText';
import { cloudLayout } from './cloudLayout';
describe('Eight-word labels',()=>{
 it('breaks after every eight words, preserving whole words, addresses and Unicode',()=>{
  const words=Array.from({length:25},(_,i)=>i===8?'a.whole.address@example.com':'word'+i);
  const lines=cloudTextLines(words.join(' '));expect(lines.map(n=>n.split(' ').length)).toEqual([8,8,8,1]);expect(lines.join(' ')).toBe(words.join(' '));
  expect(cloudText('Remember')).toBe('Remember');expect(cloudText('one\n two  three')).toBe('one two three');expect(characterLength('A🫧B')).toBe(3);
 });
 it('reserves all lines and the identifier without overlapping neighbors',()=>{
  const measure=(text:string,size:number)=>Array.from(text).length*size*.54;
  const nodes=Array.from({length:12},(_,i)=>({id:String(i),name:Array.from({length:8+i},(_,j)=>'word'+j).join(' '),percent:i/11*100,isImage:i===2,identifier:'IL012'+i}));
  const layout=cloudLayout(nodes,393,620,measure,{organic:true,compact:true});
  for(const a of layout.items){const n=nodes.find(n=>n.id===a.id)!;expect(a.height).toBeGreaterThan(cloudTextLines(n.name).length*(n.isImage?a.captionSize!:a.fontSize));for(const b of layout.items.filter(b=>b.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();}
 });
 it('preserves the min/max scale when the relative percentages are unchanged',()=>{
  const measure=(s:string,f:number)=>s.length*f*.54;
  const a=cloudLayout([{id:'a',name:'A',percent:100,characters:100},{id:'b',name:'B',percent:0,characters:1}],393,600,measure,{organic:true});
  const b=cloudLayout([{id:'a',name:'A',percent:100,characters:101},{id:'b',name:'B',percent:0,characters:2}],393,600,measure,{organic:true});
  expect(b.items[0].fontSize).toBe(a.items[0].fontSize);expect(b.items[1].fontSize).toBe(a.items[1].fontSize);
 });
});
