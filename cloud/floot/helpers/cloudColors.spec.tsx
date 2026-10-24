import { readableWordColor,randomWordColor,colorHex,colorValue,colorHue,isCloudColor,spectrumColor,unusedColor,type CloudColor } from './cloudColors';
import { cloudChanges } from './cloudChanges';
import { cloudPolicy } from './cloudPolicy';
import { schema,type CloudNode } from '../endpoints/cloud_POST.schema';
describe('Continuous cloud colors',()=>{
 it('randomizes over the readable spectrum and avoids an existing shade',()=>{expect(randomWordColor([],()=>0)).toBe(spectrumColor(0,0));expect(randomWordColor([spectrumColor(180)],()=>.5)).not.toBe(spectrumColor(180));});
 it('offers vivid, muted and neutral shades with readable contrast in both themes',()=>{const colors=new Set<string>();for(let hue=0;hue<360;hue+=3)for(let tone=0;tone<=1;tone+=.1){const color=spectrumColor(hue,tone);colors.add(color);expect(readableWordColor(color)).toBeTrue();}expect(colors.size).toBeGreaterThan(1000);expect(spectrumColor(40,0)).not.toBe(spectrumColor(40,1));});
 const credentials={workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64)};
 it('preserves every legacy color and safely accepts only full RGB values',()=>{
  expect(colorValue('blue')).toBe('#7bb3ff');expect(colorValue('white')).toBe('#f5f5f7');expect(colorValue('#A1B2C3')).toBe('#a1b2c3');
  for(const value of ['url(https://example.com)','var(--unsafe)','#fff','#12345678','red','__proto__'])expect(isCloudColor(value)).toBeFalse();
  expect(isCloudColor('#012ABC')).toBeTrue();expect(colorHex()).toBe('#f5f5f7');
 });
 it('offers intermediate spectrum shades with readable contrast on black',()=>{
  const shades=new Set<string>();for(let h=0;h<360;h+=.5){const color=spectrumColor(h);shades.add(color);const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);expect((.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]+.05)/.05).toBeGreaterThan(4.5);}
  expect(shades.size).toBeGreaterThan(600);expect(Math.abs(colorHue(spectrumColor(210))-210)).toBeLessThan(1);
 });
 it('can allocate 1024 distinct saved colors even when the same shade is chosen repeatedly',()=>{
  const used:CloudColor[]=[];for(let i=0;i<1024;i++)used.push(unusedColor('#f5f5f7',used));expect(new Set(used.map(colorHex)).size).toBe(1024);
  expect(unusedColor('#7BB3FF',['blue'])).not.toBe('#7BB3FF');expect(unusedColor('blue',['#7bb3ff'])).not.toBe('blue');
 });
 it('accepts and saves gradient edits in Public, Private and owner-only Chess',()=>{
  for(const scope of ['public','private','chess'] as const){
   const nodes:CloudNode[]=[{id:'a',name:'A',parentId:'parent',color:'blue'},{id:'b',name:'B',parentId:'parent',color:'#aabbcc'}];
   const request={...credentials,scope,action:'rename' as const,id:'a',name:'A',color:'#aabbcc' as const,version:0};
   expect(schema.safeParse(request).success).toBeTrue();const result=cloudChanges.apply(nodes,request,0);
   expect(result[0].color).not.toBe('#aabbcc');expect(result[1]).toBe(nodes[1]);expect(colorHex(result[0].color)).not.toBe(colorHex(result[1].color));
  }
  expect(cloudPolicy.writable('chess',1,true)).toBeTrue();expect(cloudPolicy.writable('chess',2,false)).toBeFalse();
 });
 it('checks seed overrides and leaves name-only edits and saved branch copies intact',()=>{
  const seeds:CloudNode[]=[{id:'a',name:'A',parentId:'parent',color:'blue'},{id:'b',name:'B',parentId:'parent',color:'rose'}];
  const request={...credentials,scope:'chess' as const,action:'rename' as const,id:'a',name:'Renamed',color:'blue' as const,version:0};
  const renamed=cloudChanges.apply([],request,0,seeds);expect(renamed[0].color).toBe('blue');expect(renamed[0].name).toBe('Renamed');
  const recolored=cloudChanges.apply([],{...request,color:'rose'},0,seeds);expect(recolored[0].color).not.toBe('rose');
  const copied=cloudChanges.apply(seeds,{...credentials,scope:'chess',action:'copy',id:'a',parentId:'b',operationId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',version:0},0);
  expect(copied.at(-1)?.color).toBe('blue');
 });
});
