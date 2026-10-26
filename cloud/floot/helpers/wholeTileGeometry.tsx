export type GridPoint={u:number;v:number};
export type TileFootprint={units:number;columns:number;rows:number;outline:GridPoint[];parts:GridPoint[][];bodyColumns:number;bodyRows:number};
const rect=(x:number,y:number,w:number,h:number):GridPoint[]=>[{u:x,v:y},{u:x+w,v:y},{u:x+w,v:y+h},{u:x,v:y+h}];
// Grow by adding whole cells around a square. Every footprint contains the
// preceding one; three cells are an L, rather than a rounded-up four-cell box.
export function wholeTileFootprint(value:number):TileFootprint{
 const units=Math.max(1,Math.floor(Number.isFinite(value)?value:1)),k=Math.floor(Math.sqrt(units)),rest=units-k*k,right=Math.min(k,rest),bottom=Math.max(0,rest-k),parts=[rect(0,0,k,k)];
 if(right)parts.push(rect(k,0,1,right));if(bottom)parts.push(rect(0,k,bottom,1));
 const raw=rest===0?rect(0,0,k,k):bottom?[{u:0,v:0},{u:k+1,v:0},{u:k+1,v:k},{u:bottom,v:k},{u:bottom,v:k+1},{u:0,v:k+1}]:[{u:0,v:0},{u:k+1,v:0},{u:k+1,v:right},{u:k,v:right},{u:k,v:k},{u:0,v:k}];
 const outline=raw.filter((p,i)=>{const a=raw[(i+raw.length-1)%raw.length],b=raw[(i+1)%raw.length];return (p.u-a.u)*(b.v-p.v)!==(p.v-a.v)*(b.u-p.u);});
 return{units,columns:k+(rest?1:0),rows:k+(bottom?1:0),outline,parts,bodyColumns:k+(rest?1:0),bodyRows:rest?Math.max(1,right):k};
}
export function wholeTileCounts(values:number[]){const positive=values.filter(n=>Number.isFinite(n)&&n>0),base=positive.length?Math.min(...positive):1;return values.map(n=>Math.max(1,Math.floor(Math.max(0,n||0)/base)));}
