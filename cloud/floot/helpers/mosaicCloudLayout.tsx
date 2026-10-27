import {rhombusMosaic,type RhombusFace} from './rhombusMosaic';
import {wholeTileCounts,wholeTileFootprint,fittedTileFootprint} from './wholeTileGeometry';
import {tileTextLines} from './cloudText';
import {identifierFootprint} from './cloudIdentifiers';
import {proportionalCloudScale} from './proportionalCloudScale';
export type MosaicItem={id:string;name:string;identifier?:string;imageUrl?:string;isImage?:boolean;percent:number;characters?:number;publishing?:string};
export function mosaicCloudLayout(items:MosaicItem[],width:number,height:number,measure:(text:string,size:number)=>number){
 items=items.filter(n=>!!n.name.trim()||!!n.isImage||!!n.imageUrl);
 if(!items.length)return{width,height,items:[],decorations:[],maxZoom:3};
 const counts=wholeTileCounts(items.map(n=>n.characters??0)),unit=96,proportions=proportionalCloudScale(items.map(n=>n.characters));
 const measured=items.map((item,i)=>{
  const fontSize=68,captionSize=fontSize,printScale=proportions.scales[i],picture=!!(item.isImage||item.imageUrl),pictureSize=picture?144:0,logical=wholeTileFootprint(counts[i]),lines=tileTextLines(item.name,logical.bodyColumns),label=identifierFootprint(item.identifier);
  const textWidth=Math.max(...lines.map(line=>measure(line,fontSize)),item.identifier?label.width:0,pictureSize),blocks=Number(!!item.name.trim())+Number(picture)+Number(!!item.identifier)+Number(!!item.publishing),textHeight=(item.name.trim()?lines.length*fontSize*1.25:0)+(item.identifier?label.height:0)+(item.publishing?24:0)+pictureSize+Math.max(0,blocks-1)*8;
  // Fit each occupied tile independently. One long label cannot inflate every
  // neighbor, and a large descendant count cannot reserve an empty square.
  // Binary lattice steps keep touching edges exact at different cell sizes.
  const baseColumns=Math.max(1,Math.ceil(textWidth/(128*.90))),baseRows=Math.max(1,Math.ceil(textHeight/(128*.90))),footprint=fittedTileFootprint(counts[i],baseColumns,baseRows),needed=Math.max(textWidth/footprint.bodyColumns,textHeight/footprint.bodyRows)/.90*printScale,quantum=2**(Math.floor(Math.log2(needed/unit))-10),cellScale=Math.ceil(needed/unit/quantum)*quantum;
  return{id:item.id,fontSize,captionSize,printScale,visualFontSize:fontSize*printScale,lines,pictureSize:picture?pictureSize:undefined,units:footprint.units,logicalUnits:counts[i],baseColumns,baseRows,cellScale,textWidth,textHeight};
 });
 const geometry=rhombusMosaic(measured,unit,width/Math.max(height,1)),byId=new Map(measured.map(n=>[n.id,n]));
 return{width:geometry.width,height:geometry.height,maxZoom:proportions.maxZoom,minFitZoom:14/Math.min(...measured.map(n=>n.visualFontSize)),items:geometry.faces.map(face=>{
  const item=byId.get(face.id)!,[a,b,c,d,x,y]=face.matrix.slice(7,-1).split(',').map(Number),w=face.contentWidth!/item.printScale,h=face.contentHeight!/item.printScale,inset=Math.min(w,h)*.04,cw=Math.min(w,item.textWidth+inset*2),ch=Math.min(h,item.textHeight+inset*2),ox=(w-cw)/2,oy=(h-ch)/2,corners=[[ox,oy],[ox+cw,oy],[ox+cw,oy+ch],[ox,oy+ch]].map(([u,v])=>({x:face.x+x+a*u+c*v,y:face.y+y+b*u+d*v})),left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y));
  return{...item,x:face.x,y:face.y,width:face.width,height:face.height,rhombus:face,content:{x:left,y:top,width:Math.max(...corners.map(p=>p.x))-left,height:Math.max(...corners.map(p=>p.y))-top}};
 }),decorations:[]};
}
export type MosaicFace=RhombusFace;
