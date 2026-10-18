type Item={id:string;name:string;imageUrl?:string;isImage?:boolean;percent:number};
export type Rect={x:number;y:number;width:number;height:number};
export type CloudLayout={width:number;height:number;items:Array<Rect&{id:string;fontSize:number}>};
function lines(text:string,size:number,width:number,measure:(text:string,size:number)=>number){
  let count=1,line="",longest=0;
  for(const word of text.split(/\s+/)){
    if(line&&measure(line+" "+word,size)<=width){line+=" "+word;continue;}
    if(line){longest=Math.max(longest,measure(line,size));count++;line="";}
    for(const char of word){
      if(line&&measure(line+char,size)>width){longest=Math.max(longest,measure(line,size));count++;line=char;}
      else line+=char;
    }
  }
  return {count,longest:Math.max(longest,measure(line,size))};
}
export function cloudLayout(items:Item[],width:number,height:number,measure:(text:string,size:number)=>number,options:{square?:boolean;compact?:boolean;previous?:CloudLayout}={}){
  const previous=options.previous,narrow=options.compact??width<600,gap=narrow?16:24,cells=new Map<string,Rect[]>(),result:CloudLayout['items']=[];
  const maxWidth=Math.max(120,Math.min(width-40,narrow?280:440));
  function keys(rect:Rect){const list:string[]=[];for(let x=Math.floor(rect.x/128);x<=Math.floor((rect.x+rect.width)/128);x++)for(let y=Math.floor(rect.y/128);y<=Math.floor((rect.y+rect.height)/128);y++)list.push(x+","+y);return list;}
  const overlaps=(rect:Rect)=>keys(rect).some(k=>(cells.get(k)||[]).some(r=>rect.x<r.x+r.width&&rect.x+rect.width>r.x&&rect.y<r.y+r.height&&rect.y+rect.height>r.y));
  const reserve=(rect:Rect)=>{for(const k of keys(rect))cells.set(k,[...(cells.get(k)||[]),rect]);};
  const measured=[...items].sort((a,b)=>b.percent-a.percent||items.indexOf(a)-items.indexOf(b)).map(item=>{
    const fontSize=(narrow?17:20)+item.percent/100*(narrow?13:18),text=lines(item.name,fontSize,maxWidth-24,measure);
    const picture=(narrow?105:135)+item.percent*.25,isPicture=item.isImage||item.imageUrl;
    const width=isPicture?picture+24:Math.max(64,text.longest+24),caption=lines(item.name,16,width-24,measure);
    return {id:item.id,fontSize,width,height:isPicture?picture+caption.count*20.8+32:text.count*fontSize*1.18+20};
  });
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
      const angle=attempt*2.399963,radius=10*Math.sqrt(attempt),x=centerX+Math.cos(angle)*radius*(options.square?1:narrow?.85:1.65)-w/2,y=centerY+Math.sin(angle)*radius-h/2,index=result.length;
      const offset=Math.max(0,Math.min(width*.18,(width-w)/2-16));
      if(!options.square&&!previous&&index>0&&index<8&&(x+w/2)*(index%2?-1:1)<offset)continue;
      if(x<(previous?12:-width/2+12)||x+w>(previous?width-12:width/2-12)||(previous&&y<12))continue;
      const rect={x,y,width:w+gap,height:h+gap};
      if(!overlaps(rect)){chosen=rect;break;}
    }
    if(!chosen)chosen={x:previous?(width-w)/2:-w/2,y:Math.max(0,...result.map(r=>r.y+r.height))+gap,width:w+gap,height:h+gap};
    reserve(chosen);result.push({...item,x:chosen.x,y:chosen.y});
  }
  if(previous)return {width,height:Math.max(height,previous.height,...result.map(r=>r.y+r.height+32)),items:result};
  const top=Math.min(0,...result.map(r=>r.y)),bottom=Math.max(0,...result.map(r=>r.y+r.height)),fullHeight=Math.max(height,options.square?width:0,bottom-top+64),offset=(fullHeight-(bottom-top))/2-top;
  return {width,height:fullHeight,items:result.map(r=>({...r,x:r.x+width/2,y:r.y+offset}))};
}
