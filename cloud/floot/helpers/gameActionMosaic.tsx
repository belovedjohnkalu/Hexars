import {pairedActionGroups,type ActionText} from './actionTileGroup';
import type {RhombusFace} from './rhombusMosaic';
type Actions={desktop:boolean;boardY:number;worldHeight:number;faces:Map<string,RhombusFace>;lines?:Map<string,string[]>;anchors?:Map<string,{left:number;top:number;maxWidth:number}>};
export function gameActionMosaic(width:number,boardHeight:number,height:number,online=false,boardWidth=540,tiled=true,text:Record<string,ActionText>={}):Actions{
 const desktop=width>=900&&height>=420;
 if(!tiled){
  const first=online?['forfeit']:['variants','rules','online','library'],second=online?['draw']:['engines','friend','reset','undo'],anchors=new Map<string,{left:number;top:number;maxWidth:number}>();
  if(desktop){const worldHeight=Math.max(height,boardHeight+24),side=(width-boardWidth)/2;for(const[ids,x]of[[first,side/2],[second,width-side/2]] as const)ids.forEach((id,i)=>anchors.set(id,{left:x,top:worldHeight*(i+.5)/ids.length,maxWidth:Math.max(100,side-24)}));return{desktop,boardY:(worldHeight-boardHeight)/2,worldHeight,faces:new Map(),anchors};}
  const boardY=(online?72:112)+12,worldHeight=Math.max(height,boardY+boardHeight+(online?24:124)),place=(ids:string[],top:number)=>ids.forEach((id,i)=>anchors.set(id,{left:width*([.24,.76,.28,.72][i]??.5),top:top+Math.floor(i/2)*52,maxWidth:Math.max(100,width*.44)}));
  if(online){place(['forfeit','draw'],36);}else{place(first,32);place(second,boardY+boardHeight+32);}return{desktop,boardY,worldHeight,faces:new Map(),anchors};
 }
 if(desktop){const boardLeft=(width-boardWidth)/2,sideWidth=Math.min(260,Math.max(132,boardLeft-32)),worldHeight=Math.max(height,boardHeight+24),[left,right]=pairedActionGroups(online?['forfeit']:['variants','rules','online','library'],online?['draw']:['engines','friend','reset','undo'],sideWidth,worldHeight-32,text),leftX=(boardLeft-left.width)/2,rightX=boardLeft+boardWidth+(boardLeft-right.width)/2;
 return{desktop,boardY:(worldHeight-boardHeight)/2,worldHeight,lines:new Map([...left.lines,...right.lines]),faces:new Map([...left.faces.map(f=>[f.id,{...f,x:f.x+leftX,y:f.y+(worldHeight-left.height)/2}] as const),...right.faces.map(f=>[f.id,{...f,x:f.x+rightX,y:f.y+(worldHeight-right.height)/2}] as const)])};}
 const stripWidth=Math.min(420,Math.max(260,width-24)),[top,bottom]=pairedActionGroups(online?['forfeit','draw']:['variants','rules','online','library'],online?[]:['engines','friend','reset','undo'],stripWidth,112,text),boardY=top.height+16,worldHeight=Math.max(height,boardY+boardHeight+bottom.height+24),left=(width-top.width)/2,bottomLeft=(width-bottom.width)/2;
 return{desktop,boardY,worldHeight,lines:new Map([...top.lines,...bottom.lines]),faces:new Map([...top.faces.map(f=>[f.id,{...f,x:f.x+left,y:f.y+4}] as const),...bottom.faces.map(f=>[f.id,{...f,x:f.x+bottomLeft,y:f.y+boardY+boardHeight+8}] as const)])};
}
