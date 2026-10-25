export type LatticePoint={u:number;v:number};
export type RhombusFace={id:string;points:LatticePoint[];span:number;plane:0|1|2;x:number;y:number;width:number;height:number;side:number;polygon:string;matrix:string;decorative?:boolean};
export const latticePixel=(p:LatticePoint,unit=1)=>({x:(p.u-p.v)*Math.sqrt(3)/2*unit,y:(p.u+p.v)/2*unit});
const add=(a:LatticePoint,b:LatticePoint,n=1)=>({u:a.u+b.u*n,v:a.v+b.v*n});
const equal=(a:LatticePoint,b:LatticePoint)=>a.u===b.u&&a.v===b.v;
const ranges=(p:LatticePoint[])=>[p.map(p=>p.u),p.map(p=>p.v),p.map(p=>p.u-p.v)].map(a=>({min:Math.min(...a),max:Math.max(...a)}));
export function rhombiOverlap(a:LatticePoint[],b:LatticePoint[]){const x=ranges(a),y=ranges(b);return x.every((r,i)=>r.max>y[i].min+1e-8&&y[i].max>r.min+1e-8);}
const cache=new Map<string,{width:number;height:number;faces:RhombusFace[]}>();
// A triangular lattice fixes every edge at 30°, 90° or150°. Three lozenges
// fill each hexagon. Alternate its two valid decompositions, then subdivide
// complete faces: the illusion varies without overlaps or approximate joins.
export function rhombusMosaic(items:{id:string;span:number}[],unit=48){
 const key=unit+':'+items.map(n=>n.id+':'+n.span).join('|'),known=cache.get(key);if(known)return known;
 if(!items.length)return{width:48,height:48,faces:[]};
 const ordered=items.map((n,i)=>({...n,order:i,span:Math.max(1,Math.ceil(n.span))})).sort((a,b)=>b.span-a.span||a.order-b.order);
 const hexCount=Math.max(1,Math.ceil(items.length/6)),baseCount=hexCount*3,divisions=Math.max(0,Math.ceil((items.length-baseCount)/3)),largeCount=baseCount-divisions;
 const largeNeed=ordered[0]?.span||1,smallNeed=ordered[Math.min(largeCount,ordered.length-1)]?.span||1,span=Math.ceil(Math.max(largeNeed,divisions?smallNeed*2:largeNeed)/2)*2;
 const centers:{q:number;r:number;score:number}[]=[];for(let radius=0;centers.length<hexCount;radius++){
  for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++){if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))!==radius)continue;centers.push({q,r,score:q*q+r*r+q*r+(Math.sin(q*7+r*11)*.2)});}
 }
 centers.sort((a,b)=>a.score-b.score||a.q-b.q||a.r-b.r);
 type Raw={points:LatticePoint[];span:number;plane:0|1|2;order:number};const raw:Raw[]=[];
 for(const{q,r}of centers.slice(0,hexCount)){
  const center={u:(q+2*r)*span,v:(-q+r)*span},flip=((q-r)%3+3)%3===1;
  const directions=flip?[{u:1,v:0},{u:0,v:1},{u:-1,v:-1}]:[{u:-1,v:0},{u:0,v:-1},{u:1,v:1}];
  for(let i=0;i<3;i++){const a=directions[i],b=directions[(i+1)%3],type=(d:LatticePoint)=>!d.v?0:!d.u?1:2,plane=(![type(a),type(b)].includes(2)?0:[type(a),type(b)].includes(0)?1:2)as 0|1|2;raw.push({points:[center,add(center,a,span),add(add(center,a,span),b,span),add(center,b,span)],span,plane,order:raw.length});}
 }
 // Distributed subdivisions give small and large faces in all three planes.
 const splitIndices=new Set(raw.map((_,i)=>i).sort((a,b)=>((a*37)%raw.length)-((b*37)%raw.length)).slice(0,divisions));
 const cells:Raw[]=raw.flatMap((face,i)=>{if(!splitIndices.has(i))return[face];const p=face.points[0],a={u:(face.points[1].u-p.u)/span,v:(face.points[1].v-p.v)/span},b={u:(face.points[3].u-p.u)/span,v:(face.points[3].v-p.v)/span},half=span/2;return[0,1].flatMap(x=>[0,1].map(y=>{const origin=add(add(p,a,x*half),b,y*half);return{...face,span:half,points:[origin,add(origin,a,half),add(add(origin,a,half),b,half),add(origin,b,half)]};}));});
 cells.sort((a,b)=>b.span-a.span||a.order-b.order);
 const pixels=cells.flatMap(f=>f.points.map(p=>latticePixel(p,unit))),padding=20,minX=Math.min(...pixels.map(p=>p.x)),minY=Math.min(...pixels.map(p=>p.y)),maxX=Math.max(...pixels.map(p=>p.x)),maxY=Math.max(...pixels.map(p=>p.y));
 const faces:RhombusFace[]=cells.map((face,i)=>{const pixels=face.points.map(p=>latticePixel(p,unit)),x=Math.min(...pixels.map(p=>p.x)),y=Math.min(...pixels.map(p=>p.y)),width=Math.max(...pixels.map(p=>p.x))-x,height=Math.max(...pixels.map(p=>p.y))-y;
  const a=face.plane===1?{u:1,v:0}:{u:0,v:-1},b=face.plane===0?{u:1,v:0}:{u:1,v:1},origin=face.points.find(p=>face.points.some(q=>equal(q,add(p,a,face.span)))&&face.points.some(q=>equal(q,add(p,b,face.span))))!;
  const p=latticePixel(origin,unit),ax=latticePixel(a),bx=latticePixel(b);
  return{id:ordered[i]?.id||'mosaic-decoration-'+i,decorative:!ordered[i],points:face.points,span:face.span,plane:face.plane,x:x-minX+padding,y:y-minY+padding,width,height,side:face.span*unit,polygon:pixels.map(p=>(p.x-x)+','+(p.y-y)).join(' '),matrix:`matrix(${ax.x},${ax.y},${bx.x},${bx.y},${p.x-x},${p.y-y})`};
 });
 const result={width:maxX-minX+padding*2,height:maxY-minY+padding*2,faces};cache.set(key,result);if(cache.size>24)cache.delete(cache.keys().next().value!);return result;
}

// A shallow joined strip reserves room for the playable board. Its lozenges
// use the same lattice and printed plane as the larger navigation mosaic.
export function rhombusStrip(ids:string[],width:number):{width:number;height:number;faces:RhombusFace[]}{
 if(!ids.length)return{width:0,height:0,faces:[]};
 const side=width/(Math.sqrt(3)/2*(ids.length+1)),unit=side;
 const faces=ids.map((id,i)=>{const u=Math.ceil(i/2),v=-Math.floor(i/2),points=[{u,v},{u:u+1,v},{u:u+1,v:v+1},{u,v:v+1}],pixels=points.map(p=>latticePixel(p,unit)),x=Math.min(...pixels.map(p=>p.x)),y=Math.min(...pixels.map(p=>p.y)),w=Math.max(...pixels.map(p=>p.x))-x,h=Math.max(...pixels.map(p=>p.y))-y,origin=latticePixel({u,v:v+1},unit);return{id,points,span:1,plane:0 as const,x:x+unit*Math.sqrt(3)/2,y,width:w,height:h,side,polygon:pixels.map(p=>(p.x-x)+','+(p.y-y)).join(' '),matrix:`matrix(${Math.sqrt(3)/2},-0.5,${Math.sqrt(3)/2},0.5,${origin.x-x},${origin.y-y})`};});
 return{width,height:Math.max(...faces.map(f=>f.y+f.height)),faces};
}
