// Legacy names remain readable so existing clouds never change color.
export const cloudColors=['white','blue','cyan','mint','amber','coral','rose','lavender'] as const;
export type CloudColor=typeof cloudColors[number]|`#${string}`;
const legacy:Record<typeof cloudColors[number],string>={white:'#f5f5f7',blue:'#7bb3ff',cyan:'#70dce2',mint:'#a5dba7',amber:'#f5d17c',coral:'#ffa78b',rose:'#f6a4d5',lavender:'#c5a1ff'};
export const isCloudColor=(value:unknown):value is CloudColor=>typeof value==='string'&&(/^[#][0-9a-f]{6}$/i.test(value)||Object.hasOwn(legacy,value));
export const colorHex=(color?:CloudColor):string=>color&&/^[#][0-9a-f]{6}$/i.test(color)?color.toLowerCase():legacy[color as keyof typeof legacy]||legacy.white;
export const colorValue=(color?:CloudColor)=>colorHex(color);
export const colorName=(color:CloudColor)=>color.startsWith('#')?color.toUpperCase():color[0].toUpperCase()+color.slice(1);
const toHex=(rgb:number[]):CloudColor=>('#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')) as CloudColor;
const luminance=(rgb:number[])=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const rgbOf=(color:CloudColor)=>[1,3,5].map(i=>parseInt(colorHex(color).slice(i,i+2),16));
export function readableWordColor(color:CloudColor):boolean{
 const rgb=rgbOf(color);return (luminance(rgb)+.05)/.05>=4.5&&1.05/(luminance(rgb.map(v=>255-v))+.05)>=4.5;
}
export function spectrumColor(hue:number,softness=.35):CloudColor{
 const t=Math.max(0,Math.min(1,softness)),light=.56+.28*t,saturation=.95*Math.pow(1-t,.7);
 const h=((hue%360)+360)%360/60,c=saturation*(1-Math.abs(2*light-1)),x=c*(1-Math.abs(h%2-1)),m=light-c/2;
 const rgb=(h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x]).map(v=>(v+m)*255);
 // Brighten only as far as needed for normal text in both appearance modes.
 for(let mix=0;mix<=1;mix+=.01){const color=toHex(rgb.map(v=>v+(255-v)*mix));if(readableWordColor(color))return color;}
 return 'white';
}
export function spectrumSoftness(color:CloudColor):number{
 if(color==='white'||colorHex(color)===colorHex('white'))return .35;
 const rgb=rgbOf(color),hue=colorHue(color);let best=.5,distance=Infinity;
 for(let i=0;i<=100;i++){const candidate=rgbOf(spectrumColor(hue,i/100)),d=candidate.reduce((sum,v,j)=>sum+(v-rgb[j])**2,0);if(d<distance){distance=d;best=i/100;}}
 return best;
}
export function spectrumGradient(softness=.35):string{return 'linear-gradient(90deg,'+Array.from({length:13},(_,i)=>spectrumColor(i*30,softness)).join(',')+')';}
export function softnessGradient(hue:number):string{return 'linear-gradient(90deg,'+Array.from({length:7},(_,i)=>spectrumColor(hue,i/6)).join(',')+')';}
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
  const color=toHex(next);if(!taken.has(color)&&(!readableWordColor(preferred)||readableWordColor(color)))return color;
 }
 // A cloud has at most 1,024 children; even a clipped corner has >4,000 shades.
 throw new Error('Couldn’t choose a new color. Try another shade.');
}

// Pick from the same readable spectrum as the manual wheel; avoid sibling colors.
export function randomWordColor(used:readonly (CloudColor|undefined)[],random:()=>number=Math.random):CloudColor{
 return unusedColor(spectrumColor(random()*360,random()),used);
}
