import {wholeTileMosaic} from './wholeTileMosaic';
import type {GridPoint} from './wholeTileGeometry';
import {latticePixel} from './wholeTileMosaic';
export {latticePixel,rhombiOverlap} from './wholeTileMosaic';
export type LatticePoint=GridPoint;
export type {WholeFace as RhombusFace} from './wholeTileMosaic';
import type {WholeFace as RhombusFace} from './wholeTileMosaic';
export function rhombusMosaic(items:{id:string;span?:number;units?:number;cellScale?:number;logicalUnits?:number;baseColumns?:number;baseRows?:number}[],unit=160,aspect=1){return wholeTileMosaic(items.map(n=>({id:n.id,units:n.units??1,cellScale:n.cellScale,logicalUnits:n.logicalUnits,baseColumns:n.baseColumns,baseRows:n.baseRows})),unit,aspect);}

// A shallow joined strip reserves room for the playable board. Its lozenges
// use the same lattice and printed plane as the larger navigation mosaic.
export function rhombusStrip(ids:string[],width:number):{width:number;height:number;faces:RhombusFace[]}{
 if(!ids.length)return{width:0,height:0,faces:[]};
 const side=width/(Math.sqrt(3)/2*(ids.length+1)),unit=side;
 const faces=ids.map((id,i)=>{const u=Math.ceil(i/2),v=-Math.floor(i/2),points=[{u,v},{u:u+1,v},{u:u+1,v:v+1},{u,v:v+1}],pixels=points.map(p=>latticePixel(p,unit)),x=Math.min(...pixels.map(p=>p.x)),y=Math.min(...pixels.map(p=>p.y)),w=Math.max(...pixels.map(p=>p.x))-x,h=Math.max(...pixels.map(p=>p.y))-y,origin=latticePixel({u,v:v+1},unit);return{id,points,span:1,plane:0 as const,x:x+unit*Math.sqrt(3)/2,y,width:w,height:h,side,polygon:pixels.map(p=>(p.x-x)+','+(p.y-y)).join(' '),matrix:`matrix(${Math.sqrt(3)/2},-0.5,${Math.sqrt(3)/2},0.5,${origin.x-x},${origin.y-y})`};});
 return{width,height:Math.max(...faces.map(f=>f.y+f.height)),faces};
}

export function rhombusColumn(ids:string[],width:number):{width:number;height:number;faces:RhombusFace[]}{
 if(!ids.length)return{width:0,height:0,faces:[]};const side=width/(Math.sqrt(3)/2*(ids.length===1?2:3)),unit=side;
 const raw=ids.map((id,i)=>{const u=Math.ceil(i/2),v=Math.floor(i/2),points=[{u,v},{u:u+1,v},{u:u+1,v:v+1},{u,v:v+1}],pixels=points.map(p=>latticePixel(p,unit)),x=Math.min(...pixels.map(p=>p.x)),y=Math.min(...pixels.map(p=>p.y)),w=Math.max(...pixels.map(p=>p.x))-x,h=Math.max(...pixels.map(p=>p.y))-y,origin=latticePixel({u,v:v+1},unit);return{id,points,span:1,plane:0 as const,x,y,width:w,height:h,side,polygon:pixels.map(p=>(p.x-x)+','+(p.y-y)).join(' '),matrix:`matrix(${Math.sqrt(3)/2},-0.5,${Math.sqrt(3)/2},0.5,${origin.x-x},${origin.y-y})`};}),left=Math.min(...raw.map(f=>f.x)),top=Math.min(...raw.map(f=>f.y));return{width,height:Math.max(...raw.map(f=>f.y+f.height))-top,faces:raw.map(f=>({...f,x:f.x-left,y:f.y-top}))};
}
