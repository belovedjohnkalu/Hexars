import {mosaicCloudLayout} from './mosaicCloudLayout';
describe('Home icon emphasis',()=>{
 it('gives a Home image more room than its caption without changing ordinary clouds',()=>{const nodes=[{id:'home',name:'Hub',percent:0,imageUrl:'hub.png',iconEmphasis:true},{id:'other',name:'Word',percent:0,imageUrl:'word.png'}],out=mosaicCloudLayout(nodes,390,700,(text,size)=>text.length*size*.5),home=out.items.find(n=>n.id==='home')!,other=out.items.find(n=>n.id==='other')!;expect(home.pictureSize).toBeGreaterThan(other.pictureSize!);expect(home.captionSize).toBeLessThan(other.captionSize!);expect(home.rhombus).toBeTruthy();expect(other.rhombus).toBeTruthy();});
});
