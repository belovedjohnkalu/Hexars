import {mosaicCloudLayout} from './mosaicCloudLayout';
import type {RhombusFace} from './rhombusMosaic';
export type ActionText={name:string;identifier?:string};
// Fit board-adjacent controls through the same complete-cell owner as clouds.
// One group scale preserves type proportions and the reserved printed bounds.
export function actionTileGroup(ids:string[],width:number,height:number,text:Record<string,ActionText>={},maximumScale=1){
 if(!ids.length)return{width:0,height:0,scale:1,faces:[] as RhombusFace[],lines:new Map<string,string[]>()};
 let context:CanvasRenderingContext2D|null=null;try{if(typeof document!=='undefined')context=document.createElement('canvas').getContext('2d');}catch{/* Complete-word fallback when canvas metrics are unavailable. */}
 const measure=(value:string,size:number)=>{if(!context)return value.length*size*.6;context.font='500 '+size+'px Inter, sans-serif';return context.measureText(value).width;};
 const layout=mosaicCloudLayout(ids.map(id=>({id,name:text[id]?.name||id,identifier:text[id]?.identifier,percent:0,characters:0})),width,height,measure),scale=Math.max(18/68,Math.min(maximumScale,width/layout.width,height/layout.height));
 const faces=layout.items.map(item=>{const f=item.rhombus,[a,b,c,d,x,y]=f.matrix.slice(7,-1).split(',').map(Number);return{...f,x:f.x*scale,y:f.y*scale,width:f.width*scale,height:f.height*scale,side:f.side*scale,contentWidth:f.contentWidth!*scale,contentHeight:f.contentHeight!*scale,printScale:(f.printScale??1)*scale,polygon:f.polygon.split(' ').map(p=>p.split(',').map(Number).map(n=>n*scale).join(',')).join(' '),matrix:`matrix(${[a,b,c,d,x,y].map(n=>n*scale).join(',')})`};});
 return{width:layout.width*scale,height:layout.height*scale,scale,faces,lines:new Map(layout.items.map(n=>[n.id,n.lines]))};
}

export function pairedActionGroups(first:string[],second:string[],width:number,height:number,text:Record<string,ActionText>={}){const a=actionTileGroup(first,width,height,text),b=actionTileGroup(second,width,height,text),scale=Math.min(a.scale,b.scale);return[a.scale===scale?a:actionTileGroup(first,width,height,text,scale),b.scale===scale?b:actionTileGroup(second,width,height,text,scale)] as const;}
