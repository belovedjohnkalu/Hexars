import {rhombusStrip} from './rhombusMosaic';
export function gameActionMosaic(width:number,boardHeight:number,height:number,online=false){
 const stripWidth=Math.min(420,Math.max(260,width-24)),top=rhombusStrip(online?['forfeit','draw']:['variants','rules','online','library'],online?Math.min(260,stripWidth):stripWidth),bottom=rhombusStrip(online?[]:['engines','friend','reset','undo'],stripWidth),boardY=top.height+16,worldHeight=Math.max(height,boardY+boardHeight+bottom.height+24),left=(width-top.width)/2,bottomLeft=(width-bottom.width)/2;
 return{boardY,worldHeight,faces:new Map([...top.faces.map(f=>[f.id,{...f,x:f.x+left,y:f.y+4}] as const),...bottom.faces.map(f=>[f.id,{...f,x:f.x+bottomLeft,y:f.y+boardY+boardHeight+8}] as const)])};
}
