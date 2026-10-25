import {rhombusMosaic,type RhombusFace} from './rhombusMosaic';
import {cloudTextLines} from './cloudText';
import {identifierFootprint} from './cloudIdentifiers';
export type MosaicItem={id:string;name:string;identifier?:string;imageUrl?:string;isImage?:boolean;percent:number;characters?:number;publishing?:string};
export function mosaicCloudLayout(items:MosaicItem[],width:number,height:number,measure:(text:string,size:number)=>number){
 if(!items.length)return{width,height,items:[],decorations:[]};
 const unit=44,measured=items.map(item=>{const percent=Math.max(0,Math.min(100,item.percent)),fontSize=34+percent*.20,captionSize=fontSize,picture=!!(item.isImage||item.imageUrl),hash=Array.from(item.id).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,17),pictureSize=picture?88+(hash%4)*18+percent*.35:0,labelSize=picture?captionSize:fontSize,lines=cloudTextLines(item.name,{width:Math.max(150,Math.min(245,width*.60)),measure:text=>measure(text,labelSize)}),footprint=identifierFootprint(item.identifier),textWidth=Math.max(...lines.map(line=>measure(line,labelSize))),textHeight=lines.length*labelSize*1.25+(item.identifier?footprint.height+8:0)+(item.publishing?26:0),needed=Math.max(textWidth,pictureSize,textHeight+pictureSize+(picture?12:0))/.76;
  return{id:item.id,fontSize,captionSize,lines,pictureSize:picture?pictureSize:undefined,span:Math.max(3,Math.ceil(needed/unit))};});
 const geometry=rhombusMosaic(measured,unit),byId=new Map(measured.map(n=>[n.id,n]));
 return{width:Math.max(1,geometry.width),height:Math.max(1,geometry.height),items:geometry.faces.filter(f=>!f.decorative).map(face=>({...byId.get(face.id)!,x:face.x,y:face.y,width:face.width,height:face.height,rhombus:face})),decorations:geometry.faces.filter(f=>f.decorative)};
}
export type MosaicFace=RhombusFace;
