import {rhombusStrip,rhombusColumn} from './rhombusMosaic';
export function gameActionMosaic(width:number,boardHeight:number,height:number,online=false,boardWidth=540){
 const desktop=width>=900&&height>=420;
 if(desktop){const boardLeft=(width-boardWidth)/2,sideWidth=Math.min(260,Math.max(132,boardLeft-32)),left=rhombusColumn(online?['forfeit']:['variants','rules','online','library'],online?Math.min(180,sideWidth):sideWidth),right=rhombusColumn(online?['draw']:['engines','friend','reset','undo'],online?Math.min(180,sideWidth):sideWidth),worldHeight=Math.max(height,boardHeight+24),leftX=(boardLeft-left.width)/2,rightX=boardLeft+boardWidth+(boardLeft-right.width)/2;
 return{desktop,boardY:(worldHeight-boardHeight)/2,worldHeight,faces:new Map([...left.faces.map(f=>[f.id,{...f,x:f.x+leftX,y:f.y+(worldHeight-left.height)/2}] as const),...right.faces.map(f=>[f.id,{...f,x:f.x+rightX,y:f.y+(worldHeight-right.height)/2}] as const)])};}
 const stripWidth=Math.min(420,Math.max(260,width-24)),top=rhombusStrip(online?['forfeit','draw']:['variants','rules','online','library'],online?Math.min(260,stripWidth):stripWidth),bottom=rhombusStrip(online?[]:['engines','friend','reset','undo'],stripWidth),boardY=top.height+16,worldHeight=Math.max(height,boardY+boardHeight+bottom.height+24),left=(width-top.width)/2,bottomLeft=(width-bottom.width)/2;
 return{desktop,boardY,worldHeight,faces:new Map([...top.faces.map(f=>[f.id,{...f,x:f.x+left,y:f.y+4}] as const),...bottom.faces.map(f=>[f.id,{...f,x:f.x+bottomLeft,y:f.y+boardY+boardHeight+8}] as const)])};
}
