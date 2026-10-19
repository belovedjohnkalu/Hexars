import { identifierFootprint } from "./cloudIdentifiers";
type Item={id:string;name:string;identifier?:string;imageUrl?:string;isImage?:boolean;percent:number};
export type Rect={x:number;y:number;width:number;height:number};
export type CloudLayout={width:number;height:number;items:Array<Rect&{id:string;fontSize:number;pictureSize?:number;captionSize?:number;gridSlot?:number}>};
export function cloudLayout(items:Item[],width:number,height:number,measure:(text:string,size:number)=>number,options:{organic?:boolean;square?:boolean;boardGrid?:boolean;columns?:number;compact?:boolean;previous?:CloudLayout}={}){
  const previous=options.previous,narrow=options.compact??width<600,gap=options.organic?(narrow?5:8):narrow?16:24,cells=new Map<string,Rect[]>(),result:CloudLayout['items']=[];
  function keys(rect:Rect){const list:string[]=[];for(let x=Math.floor(rect.x/128);x<=Math.floor((rect.x+rect.width)/128);x++)for(let y=Math.floor(rect.y/128);y<=Math.floor((rect.y+rect.height)/128);y++)list.push(x+","+y);return list;}
  const overlaps=(rect:Rect)=>keys(rect).some(k=>(cells.get(k)||[]).some(r=>rect.x<r.x+r.width&&rect.x+rect.width>r.x&&rect.y<r.y+r.height&&rect.y+rect.height>r.y));
  const reserve=(rect:Rect)=>{for(const k of keys(rect))cells.set(k,[...(cells.get(k)||[]),rect]);};
  const binary=options.organic&&new Set(items.map(n=>n.percent)).size===2;
  const measured=[...items].sort((a,b)=>b.percent-a.percent||items.indexOf(a)-items.indexOf(b)).map(item=>{
    const percent=binary?30+item.percent*.4:item.percent;
    const identifier=identifierFootprint(item.identifier),fontSize=options.organic?(narrow?15:17)+Math.pow(percent/100,1.15)*(narrow?44:57):(narrow?17:20)+item.percent/100*(narrow?13:18);
    const name=item.name.replace(/\s+/g,' '),picture=options.organic?(narrow?82:110)+percent*.65:(narrow?105:135)+item.percent*.25,captionSize=options.organic?14+percent*.09:16,isPicture=item.isImage||item.imageUrl;
    const labelWidth=measure(name,isPicture?captionSize:fontSize)+(options.organic?12:24)+identifier.width;
    return {id:item.id,fontSize,width:Math.max(64,labelWidth,isPicture?picture+24:0),height:isPicture?picture+Math.max(captionSize*1.3,identifier.height)+(options.organic?20:32):Math.max(fontSize*1.18,identifier.height)+(options.organic?12:20),...(isPicture?{pictureSize:picture,captionSize}:{})};
  });
  if(options.organic&&measured.length>1)width=Math.max(width,Math.max(...measured.map(n=>n.width))*2.25+32,Math.sqrt(measured.reduce((sum,n)=>sum+(n.width+gap)*(n.height+gap),0))*1.4);
  if(options.boardGrid){
    // Boards is an aligned two-column collection, not a spiral whose outer
    // previews disappear beyond a narrow camera. Retain slots after deletion.
    const columns=options.columns??2,cellWidth=Math.max(160,...measured.map(n=>n.width),...(previous?.items.map(n=>n.width)||[])),cellHeight=Math.max(160,...measured.map(n=>n.height),...(previous?.items.map(n=>n.height)||[]));
    let nextSlot=Math.max(-1,...(previous?.items.map(n=>n.gridSlot??-1)||[]))+1;
    const placed=measured.map(item=>({...item,gridSlot:previous?.items.find(n=>n.id===item.id)?.gridSlot??nextSlot++}));
    const rows=Math.ceil((Math.max(-1,...placed.map(n=>n.gridSlot),...(previous?.items.map(n=>n.gridSlot??-1)||[]))+1)/columns);
    const worldWidth=Math.max(width,columns*cellWidth+gap+32),worldHeight=Math.max(height,rows*(cellHeight+gap)-gap+32,previous?.height||0);
    const left=(worldWidth-columns*cellWidth-gap)/2,top=16;
    return {width:worldWidth,height:worldHeight,items:placed.map(item=>({...item,x:left+(item.gridSlot%columns)*(cellWidth+gap)+(cellWidth-item.width)/2,y:top+Math.floor(item.gridSlot/columns)*(cellHeight+gap)}))};
  }
  // The spatial world grows to fit whole labels; labels never split or shrink.
  width=Math.max(width,previous?.width||0,...measured.map(item=>item.width+32));
  const pending:typeof measured=[];
  // Keep retained words anchored before placing additions. Never normalize the
  // whole cloud again after deletion, restore, realtime refresh or an edit.
  for(const item of measured){
    const old=previous?.items.find(n=>n.id===item.id);
    if(!old){pending.push(item);continue;}
    const rect={x:old.x+(old.width-item.width)/2,y:old.y+(old.height-item.height)/2,width:item.width+gap,height:item.height+gap};
    if(rect.x<12||rect.x+item.width>width-12||rect.y<12||overlaps(rect)){pending.push(item);continue;}
    reserve(rect);result.push({...item,x:rect.x,y:rect.y});
  }
  for(const item of pending){
    const {width:w,height:h}=item,old=previous?.items.find(n=>n.id===item.id);
    const centerX=old?old.x+old.width/2:previous?width/2:0,centerY=old?old.y+old.height/2:previous?previous.height/2:0;
    let chosen:Rect|null=null;
    for(let attempt=0;attempt<12000;attempt++){
      const angle=attempt*2.399963,radius=(options.organic?6:10)*Math.sqrt(attempt),x=centerX+Math.cos(angle)*radius*(options.organic?1.25:options.square?1:narrow?.85:1.65)-w/2,y=centerY+Math.sin(angle)*radius-h/2,index=result.length;
      const offset=Math.max(0,Math.min(width*.18,(width-w)/2-16));
      if(!options.organic&&!options.square&&!previous&&index>0&&index<8&&(x+w/2)*(index%2?-1:1)<offset)continue;
      if(x<(previous?12:-width/2+12)||x+w>(previous?width-12:width/2-12)||(previous&&y<12))continue;
      const rect={x,y,width:w+gap,height:h+gap};
      if(!overlaps(rect)){chosen=rect;break;}
    }
    if(!chosen)chosen={x:previous?(width-w)/2:-w/2,y:Math.max(0,...result.map(r=>r.y+r.height))+gap,width:w+gap,height:h+gap};
    reserve(chosen);result.push({...item,x:chosen.x,y:chosen.y});
  }
  if(previous)return {width,height:Math.max(height,previous.height,...result.map(r=>r.y+r.height+32)),items:result};
  const left=Math.min(...result.map(r=>r.x),0),right=Math.max(...result.map(r=>r.x+r.width),0),center=(left+right)/2;
  const top=Math.min(0,...result.map(r=>r.y)),bottom=Math.max(0,...result.map(r=>r.y+r.height)),fullHeight=Math.max(height,options.square?width:0,bottom-top+64),offset=(fullHeight-(bottom-top))/2-top;
  return {width,height:fullHeight,items:result.map(r=>({...r,x:r.x+width/2-center,y:r.y+offset}))};
}
