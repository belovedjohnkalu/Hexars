type Item={id:string;name:string;imageUrl?:string;isImage?:boolean;percent:number};
type Rect={x:number;y:number;width:number;height:number};
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
export function cloudLayout(items:Item[],width:number,height:number,measure:(text:string,size:number)=>number){
  const narrow=width<600,gap=narrow?16:24,cells=new Map<string,Rect[]>(),result:Array<Rect&{id:string;fontSize:number}>=[];
  const maxWidth=Math.max(120,Math.min(width-40,narrow?280:440));
  function keys(rect:Rect){const list:string[]=[];for(let x=Math.floor(rect.x/128);x<=Math.floor((rect.x+rect.width)/128);x++)for(let y=Math.floor(rect.y/128);y<=Math.floor((rect.y+rect.height)/128);y++)list.push(x+","+y);return list;}
  for(const item of [...items].sort((a,b)=>b.percent-a.percent||items.indexOf(a)-items.indexOf(b))){
    const fontSize=(narrow?25:30)+item.percent/100*(narrow?25:42),text=lines(item.name,fontSize,maxWidth-24,measure);
    const picture=(narrow?112:144)+item.percent*.65,isPicture=item.isImage||item.imageUrl;
    const w=isPicture?picture+24:Math.max(64,text.longest+24);
    const caption=lines(item.name,18,w-24,measure);
    const h=isPicture?picture+caption.count*23.4+34:text.count*fontSize*1.18+20;
    let chosen:Rect|null=null;
    for(let attempt=0;attempt<12000;attempt++){
      const angle=attempt*2.399963,radius=10*Math.sqrt(attempt),x=Math.cos(angle)*radius*(narrow?.85:1.65)-w/2,y=Math.sin(angle)*radius-h/2,index=result.length;
      const offset=Math.max(0,Math.min(width*.18,(width-w)/2-16));
      if(index>0&&index<8&&(x+w/2)*(index%2?-1:1)<offset)continue;
      if(x < -width/2+12||x+w > width/2-12)continue;
      const rect={x,y,width:w+gap,height:h+gap};
      const overlaps=keys(rect).some(k=>(cells.get(k)||[]).some(r=>rect.x<r.x+r.width&&rect.x+rect.width>r.x&&rect.y<r.y+r.height&&rect.y+rect.height>r.y));
      if(!overlaps){chosen=rect;break;}
    }
    if(!chosen)chosen={x:-w/2,y:Math.max(0,...result.map(r=>r.y+r.height))+gap,width:w+gap,height:h+gap};
    for(const k of keys(chosen))cells.set(k,[...(cells.get(k)||[]),chosen]);
    result.push({...chosen,width:w,height:h,id:item.id,fontSize});
  }
  const top=Math.min(0,...result.map(r=>r.y)),bottom=Math.max(0,...result.map(r=>r.y+r.height)),fullHeight=Math.max(height,bottom-top+64),offset=(fullHeight-(bottom-top))/2-top;
  return {height:fullHeight,items:result.map(r=>({...r,x:r.x+width/2,y:r.y+offset}))};
}
