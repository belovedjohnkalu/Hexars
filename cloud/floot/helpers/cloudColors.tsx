// Legacy names remain readable so existing clouds never change color.
export const cloudColors=['white','blue','cyan','mint','amber','coral','rose','lavender'] as const;
export type CloudColor=typeof cloudColors[number]|`#${string}`;
const legacy:Record<typeof cloudColors[number],string>={white:'#f5f5f7',blue:'#7bb3ff',cyan:'#70dce2',mint:'#a5dba7',amber:'#f5d17c',coral:'#ffa78b',rose:'#f6a4d5',lavender:'#c5a1ff'};
export const isCloudColor=(value:unknown):value is CloudColor=>typeof value==='string'&&(/^[#][0-9a-f]{6}$/i.test(value)||Object.hasOwn(legacy,value));
export const colorHex=(color?:CloudColor):string=>color&&/^[#][0-9a-f]{6}$/i.test(color)?color.toLowerCase():legacy[color as keyof typeof legacy]||legacy.white;
export function accessibleCloudHex(hex:string,dark=false){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),lum=(channels:number[])=>channels.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),background=lum(dark?[8,9,11]:[250,250,249]),contrast=(l:number)=>dark?(l+.05)/(background+.05):(background+.05)/(l+.05);let current=rgb;for(let step=0;step<80&&contrast(lum(current))<4.6;step++)current=current.map(v=>dark?v+(255-v)*.045:v*.95);return '#'+current.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}
export const colorValue=(color?:CloudColor)=>color&&!color.startsWith('#')?'var(--word-'+color+')':!color?'var(--word-white)':'light-dark('+accessibleCloudHex(colorHex(color))+','+accessibleCloudHex(colorHex(color),true)+')';
export const colorName=(color:CloudColor)=>color.startsWith('#')?color.toUpperCase():color[0].toUpperCase()+color.slice(1);
const toHex=(rgb:number[]):CloudColor=>('#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')) as CloudColor;
export function spectrumColor(hue:number):CloudColor{
 const h=((hue%360)+360)%360/60,c=.84*(1-Math.abs(2*.46-1)),x=c*(1-Math.abs(h%2-1)),m=.46-c/2;
 const rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
 return accessibleCloudHex(toHex(rgb.map(v=>(v+m)*255))) as CloudColor;
}
export function colorHue(color:CloudColor):number{
 const hex=colorHex(color),[r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 if(!d)return 210;
 return ((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60+360)%360;
}
// Exact RGB uniqueness, not a promise that adjacent shades look different.
// Search nearby RGB shades rather than a small fixed palette: 1,024 siblings fit.
export function unusedColor(preferred:CloudColor,used:readonly (CloudColor|undefined)[]):CloudColor{
 const hex=colorHex(preferred),taken=new Set(used.map(colorHex));
 if(!taken.has(hex))return preferred;
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 for(let radius=1;radius<=16;radius++)for(let r=-radius;r<=radius;r++)for(let g=-radius;g<=radius;g++)for(let b=-radius;b<=radius;b++){
  if(Math.max(Math.abs(r),Math.abs(g),Math.abs(b))!==radius)continue;
  const next=rgb.map((v,i)=>v+[r,g,b][i]);if(next.some(v=>v<0||v>255))continue;
  const color=toHex(next);if(!taken.has(color))return color;
 }
 // A cloud has at most 1,024 children; even a clipped corner has >4,000 shades.
 throw new Error('Couldn’t choose a new color. Try another shade.');
}

// Prefer paint that looks different from the last few colors, not merely a
// different RGB triplet. Keep the first pick uniform across the full wheel.
export function randomWordColor(used:readonly (CloudColor|undefined)[],random:()=>number=Math.random):CloudColor{
 const start=random()*360,recent=used.filter((color):color is CloudColor=>!!color).slice(-4);
 if(!recent.length)return spectrumColor(start);
 const taken=new Set(used.map(colorHex));let best:CloudColor|undefined,score=-1;
 for(let i=0;i<48;i++){
  const hue=(start+i*137.50776405)%360,color=spectrumColor(hue);
  if(taken.has(colorHex(color)))continue;
  const gap=Math.min(...recent.map(previous=>{const distance=Math.abs(hue-colorHue(previous));return Math.min(distance,360-distance);}));
  if(gap>score){best=color;score=gap;}
 }
 return best??unusedColor(spectrumColor(start),used);
}
