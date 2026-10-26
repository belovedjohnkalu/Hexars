import {rhombusMosaic,type RhombusFace} from './rhombusMosaic';
import {wholeTileCounts,wholeTileFootprint} from './wholeTileGeometry';
import {tileTextLines} from './cloudText';
import {identifierFootprint} from './cloudIdentifiers';
export type MosaicItem={id:string;name:string;identifier?:string;imageUrl?:string;isImage?:boolean;percent:number;characters?:number;publishing?:string};
export function mosaicCloudLayout(items:MosaicItem[],width:number,height:number,measure:(text:string,size:number)=>number){
 items=items.filter(n=>!!n.name.trim()||!!n.isImage||!!n.imageUrl);
 if(!items.length)return{width,height,items:[],decorations:[]};
 const counts=wholeTileCounts(items.map(n=>n.characters??0));
 const measured=items.map((item,i)=>{const percent=Math.max(0,Math.min(100,item.percent)),fontSize=48+percent*.20,captionSize=fontSize,picture=!!(item.isImage||item.imageUrl),hash=Array.from(item.id).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,17),pictureSize=picture?88+(hash%4)*18+percent*.35:0,footprint=wholeTileFootprint(counts[i]),lines=tileTextLines(item.name,footprint.bodyColumns),label=identifierFootprint(item.identifier),textWidth=Math.max(...lines.map(line=>measure(line,fontSize)),item.identifier?label.width:0),textHeight=lines.length*fontSize*1.25+(item.identifier?label.height+8:0)+(item.publishing?26:0),needed=Math.max(textWidth/footprint.bodyColumns,(textHeight+pictureSize+(picture?12:0))/footprint.bodyRows,pictureSize/footprint.bodyColumns)/.78;
 return{id:item.id,fontSize,captionSize,lines,pictureSize:picture?pictureSize:undefined,units:counts[i],needed,textWidth:Math.max(textWidth,pictureSize),textHeight:textHeight+pictureSize+(picture?12:0)};});
 // A common unit keeps areas comparable. Labels reserve space without changing
 // their own type size; only descendant characters add complete unit cells.
 const unit=Math.max(132,...measured.map(n=>n.needed)),geometry=rhombusMosaic(measured,unit),byId=new Map(measured.map(n=>[n.id,n]));
 return{width:geometry.width,height:geometry.height,items:geometry.faces.map(raw=>{const measured=byId.get(raw.id)!,face={...raw,contentWidth:Math.min(raw.contentWidth!,Math.max(unit,measured.textWidth/.78)),contentHeight:Math.min(raw.contentHeight!,Math.max(unit,measured.textHeight/.78))},[a,b,c,d,x,y]=face.matrix.slice(7,-1).split(',').map(Number),w=face.contentWidth,h=face.contentHeight,cw=Math.min(w,measured.textWidth+unit*.04),ch=Math.min(h,measured.textHeight+unit*.04),ox=(w-cw)/2,oy=(h-ch)/2,corners=[[ox,oy],[ox+cw,oy],[ox+cw,oy+ch],[ox,oy+ch]].map(([u,v])=>({x:face.x+x+a*u+c*v,y:face.y+y+b*u+d*v})),left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y));return{...measured,x:face.x,y:face.y,width:face.width,height:face.height,rhombus:face,content:{x:left,y:top,width:Math.max(...corners.map(p=>p.x))-left,height:Math.max(...corners.map(p=>p.y))-top}};}),decorations:[]};
}
export type MosaicFace=RhombusFace;
