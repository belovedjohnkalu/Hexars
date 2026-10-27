import {pairedActionGroups,type ActionText} from './actionTileGroup';
import type {RhombusFace} from './rhombusMosaic';
type Actions={desktop:boolean;boardY:number;worldHeight:number;faces:Map<string,RhombusFace>;lines?:Map<string,string[]>;anchors?:Map<string,{left:number;top:number;maxWidth:number}>};
export function gameActionMosaic(width:number,boardHeight:number,height:number,online=false,boardWidth=540,tiled=true,text:Record<string,ActionText>={}):Actions{
 const desktop=width>=900&&height>=420;
 if(!tiled){
  const first=online?['forfeit']:['variants','rules','online','library'],second=online?['draw']:['engines','friend','reset','undo'],anchors=new Map<string,{left:number;top:number;maxWidth:number}>();
  if(desktop){const worldHeight=Math.max(height,boardHeight+24),side=(width-boardWidth)/2;
   for(const[ids,left]of[[first,0],[second,width-side]] as const)ids.forEach((id,i)=>{const slots=ids.length===1?[[.5,.5]]:[[.5,.18],[.25,.5],[.75,.5],[.5,.82]],slot=slots[i];anchors.set(id,{left:left+side*slot[0],top:worldHeight*slot[1],maxWidth:Math.max(70,side*((i===1||i===2) ? .46 : .88))});});
   return{desktop,boardY:(worldHeight-boardHeight)/2,worldHeight,faces:new Map(),anchors};}
  const boardY=online?84:160,worldHeight=Math.max(height,boardY+boardHeight+(online?24:150)),place=(ids:string[],top:number)=>ids.forEach((id,i)=>{const slots=ids.length===2?[[.25,0],[.75,0]]:[[.5,0],[.24,48],[.76,48],[.5,96]],slot=slots[i];anchors.set(id,{left:width*slot[0],top:top+slot[1],maxWidth:Math.max(90,width*((i===1||i===2) ? .42 : .84))});});
  if(online){place(['forfeit','draw'],36);}else{place(first,28);place(second,boardY+boardHeight+28);}return{desktop,boardY,worldHeight,faces:new Map(),anchors};
 }
 if(desktop){const boardLeft=(width-boardWidth)/2,sideWidth=Math.min(260,Math.max(132,boardLeft-32)),worldHeight=Math.max(height,boardHeight+24),[left,right]=pairedActionGroups(online?['forfeit']:['variants','rules','online','library'],online?['draw']:['engines','friend','reset','undo'],sideWidth,worldHeight-32,text),leftX=(boardLeft-left.width)/2,rightX=boardLeft+boardWidth+(boardLeft-right.width)/2;
 return{desktop,boardY:(worldHeight-boardHeight)/2,worldHeight,lines:new Map([...left.lines,...right.lines]),faces:new Map([...left.faces.map(f=>[f.id,{...f,x:f.x+leftX,y:f.y+(worldHeight-left.height)/2}] as const),...right.faces.map(f=>[f.id,{...f,x:f.x+rightX,y:f.y+(worldHeight-right.height)/2}] as const)])};}
 const stripWidth=Math.min(420,Math.max(260,width-24)),[top,bottom]=pairedActionGroups(online?['forfeit','draw']:['variants','rules','online','library'],online?[]:['engines','friend','reset','undo'],stripWidth,112,text),boardY=top.height+16,worldHeight=Math.max(height,boardY+boardHeight+bottom.height+24),left=(width-top.width)/2,bottomLeft=(width-bottom.width)/2;
 return{desktop,boardY,worldHeight,lines:new Map([...top.lines,...bottom.lines]),faces:new Map([...top.faces.map(f=>[f.id,{...f,x:f.x+left,y:f.y+4}] as const),...bottom.faces.map(f=>[f.id,{...f,x:f.x+bottomLeft,y:f.y+boardY+boardHeight+8}] as const)])};
}
