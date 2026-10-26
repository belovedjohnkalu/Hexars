import {safePageURL} from './pageURL';
import {readPageHistory,type PageHistory} from './pageHistory';
import {cloudLayout,type CloudLayout} from './cloudLayout';
import type {CloudColor} from './cloudColors';
import {pageGeometry,pageScreenIds,type PageTree,type PageDirection} from './pageWorkspace';
export type TileScreen={id:number;url:string;label:string;characters?:number;history?:PageHistory};
export type OpenTile={number?:number;name?:string;color?:CloudColor;id:number;primary:number;focus:number;screens:TileScreen[];tree:PageTree};
export type TileState={nextTileNumber?:number;tiles:OpenTile[];current:number;trail:number[];cursor:number;nextId:number};
export const safeTileURL=safePageURL;
export const tileName=(tile:OpenTile)=>tile.name?.trim()||'Tile '+(tile.number??tile.id+1);
export function tileLabel(value:string){return value.replace(/\s*[·|]\s*(?:ION|Board Games|Hexagons).*$/,'').trim()||'ION';}
export function createTileState(url:string):TileState{return{nextTileNumber:2,tiles:[{id:0,number:1,primary:0,focus:0,screens:[{id:0,url:safeTileURL(url)||'/',label:'ION'}],tree:{screen:0}}],current:0,trail:[0],cursor:0,nextId:1};}
export function visitTile(state:TileState,id:number):TileState{
 if(state.current===id||!state.tiles.some(t=>t.id===id))return state;
 const trail=[...state.trail.slice(0,state.cursor+1),id];return{...state,current:id,trail,cursor:trail.length-1};
}
export function stepTile(state:TileState,step:number):TileState{
 let cursor=state.cursor+step;while(cursor>=0&&cursor<state.trail.length){const id=state.trail[cursor];if(id!==state.current&&state.tiles.some(t=>t.id===id))return{...state,current:id,cursor};cursor+=step;}return state;
}
export function tileDimensions(tree:PageTree):{columns:number;rows:number}{
 if('screen'in tree)return{columns:1,rows:1};const a=tileDimensions(tree.first),b=tileDimensions(tree.second);return tree.axis==='x'?{columns:a.columns+b.columns,rows:Math.max(a.rows,b.rows)}:{columns:Math.max(a.columns,b.columns),rows:a.rows+b.rows};
}
export function rhombusLayout(tiles:OpenTile[]){
 const occupied=new Set<string>(),placed:{tile:OpenTile;x:number;y:number;columns:number;rows:number}[]=[];
 // Shape, then permanent tile identity, determines placement, not visit order.
 const ordered=[...tiles].sort((a,b)=>{const x=tileDimensions(a.tree),y=tileDimensions(b.tree);return y.columns*y.rows-x.columns*x.rows||a.id-b.id;});
 for(const tile of ordered){const{columns,rows}=tileDimensions(tile.tree),free=(x:number,y:number)=>{for(let a=x;a<x+columns;a++)for(let b=y;b<y+rows;b++)if(occupied.has(a+','+b))return false;return true;};let best={x:0,y:0,score:Infinity};const radius=Math.ceil(Math.sqrt(occupied.size+columns*rows))+columns+rows+1;for(let x=-radius;x<=radius;x++)for(let y=-radius;y<=radius;y++){if(!free(x,y))continue;const cx=x+columns/2,cy=y+rows/2;let touching=0;for(let a=x;a<x+columns;a++){if(occupied.has(a+','+(y-1)))touching++;if(occupied.has(a+','+(y+rows)))touching++;}for(let b=y;b<y+rows;b++){if(occupied.has((x-1)+','+b))touching++;if(occupied.has((x+columns)+','+b))touching++;}const score=(cx-cy)**2+(cx+cy)**2*.7-touching*.8;if(score<best.score)best={x,y,score};}for(let x=best.x;x<best.x+columns;x++)for(let y=best.y;y<best.y+rows;y++)occupied.add(x+','+y);placed.push({tile,x:best.x,y:best.y,columns,rows});}
 const unit=132,project=(x:number,y:number)=>({x:(x-y)*unit*.8660254,y:(x+y)*unit*.5});
 const raw=placed.map(t=>{const points=[project(t.x,t.y),project(t.x+t.columns,t.y),project(t.x+t.columns,t.y+t.rows),project(t.x,t.y+t.rows)],xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys);return{...t,left,top,width:Math.max(...xs)-left,height:Math.max(...ys)-top,points};});
 const minX=Math.min(0,...raw.map(t=>t.left))-32,minY=Math.min(0,...raw.map(t=>t.top))-32,maxX=Math.max(0,...raw.map(t=>t.left+t.width))+32,maxY=Math.max(0,...raw.map(t=>t.top+t.height))+32;
 return{width:maxX-minX,height:maxY-minY,tiles:raw.map(t=>{const geometry=pageGeometry(t.tile.tree,t.columns,t.rows);return{...t,left:t.left-minX,top:t.top-minY,polygon:t.points.map(p=>`${p.x-t.left},${p.y-t.top}`).join(' '),lines:geometry.dividers.map(line=>{const a=project(t.x+line.x1,t.y+line.y1),b=project(t.x+line.x2,t.y+line.y2);return{x1:a.x-t.left,y1:a.y-t.top,x2:b.x-t.left,y2:b.y-t.top};})};})};
}
export function nearestRhombus(tiles:OpenTile[],id:number,direction:PageDirection,positions?:CloudLayout['items']){
 const rects=positions||cloudLayout([...tiles.map(t=>({id:'open-tile-'+t.id,name:tileName(t),percent:0})),{id:'page-tile-new',name:'New Tile',percent:0}],520,520,(text,size)=>text.length*size*.6,{rhombi:true}).items;
 const list=tiles.map(tile=>({tile,rect:rects.find(r=>r.id==='open-tile-'+tile.id)!})).filter(t=>!!t.rect),from=list.find(t=>t.tile.id===id);if(!from)return id;
 const sign=direction==='left'||direction==='up'?-1:1,horizontal=direction==='left'||direction==='right';return list.filter(t=>t!==from).map(t=>{const dx=t.rect.x+t.rect.width/2-from.rect.x-from.rect.width/2,dy=t.rect.y+t.rect.height/2-from.rect.y-from.rect.height/2,along=(horizontal?dx:dy)*sign;return{t,along,score:along+Math.abs(horizontal?dy:dx)*1.5};}).filter(t=>t.along>1).sort((a,b)=>a.score-b.score)[0]?.t.tile.id??id;
}

export function readTileState(raw:string|null,fallback:string):TileState{
 try{const s=JSON.parse(raw||'null') as TileState;if(!s||!Array.isArray(s.tiles)||!s.tiles.length||!Number.isSafeInteger(s.nextId)||s.nextId<1)return createTileState(fallback);const ids=new Set<number>(),screenIds=new Set<number>();for(const tile of s.tiles){if(tile.number!==undefined&&(!Number.isSafeInteger(tile.number)||tile.number<1))throw Error();if(tile.name!==undefined&&(typeof tile.name!=='string'||!tile.name.trim()))throw Error();if(!Number.isSafeInteger(tile.id)||ids.has(tile.id)||!Array.isArray(tile.screens)||!tile.screens.length)throw Error();ids.add(tile.id);let nodes=0;const validate=(tree:PageTree,depth=0):void=>{if(++nodes>4096||depth>64||!tree||typeof tree!=='object')throw Error();if('screen'in tree){if(!Number.isSafeInteger(tree.screen)||screenIds.has(tree.screen)||!tile.screens.some(v=>v.id===tree.screen))throw Error();screenIds.add(tree.screen);}else{if(!['x','y'].includes(tree.axis)||!(tree.ratio>=.15&&tree.ratio<=.85))throw Error();validate(tree.first,depth+1);validate(tree.second,depth+1);}};validate(tile.tree);if(pageScreenIds(tile.tree).length!==tile.screens.length||!tile.screens.some(v=>v.id===tile.primary)||!tile.screens.some(v=>v.id===tile.focus))throw Error();for(const v of tile.screens){if(!safeTileURL(v.url)||typeof v.label!=='string'||v.characters!==undefined&&(!Number.isSafeInteger(v.characters)||v.characters<0))throw Error();v.label=tileLabel(v.label);if(v.history)v.history=readPageHistory(v.history,v.url);}}if(!ids.has(s.current)||!Array.isArray(s.trail)||!s.trail.every(id=>ids.has(id))||!Number.isSafeInteger(s.cursor)||s.cursor<0||s.cursor>=s.trail.length||s.trail[s.cursor]!==s.current||s.nextId<=Math.max(...screenIds,...ids))throw Error();if(s.nextTileNumber!==undefined&&(!Number.isSafeInteger(s.nextTileNumber)||s.nextTileNumber<1))throw Error();const primary=s.tiles.find(t=>t.id===s.current)!,url=primary.screens.find(v=>v.id===primary.primary)!.url;return url===fallback?s:createTileState(fallback);}catch{return createTileState(fallback);}
}

export const tileCharacters=(tile:OpenTile)=>tile.screens.reduce((sum,screen)=>sum+(screen.characters??Array.from(screen.label).length),0);
export function removeOpenTile(state:TileState,id:number):TileState{
 if(!state.tiles.some(t=>t.id===id))return state;const tiles=state.tiles.filter(t=>t.id!==id);if(!tiles.length)return createTileState('/');
 const previous=state.trail.slice(0,state.cursor+1).filter(v=>v!==id&&tiles.some(t=>t.id===v)),future=state.trail.slice(state.cursor+1).filter(v=>v!==id&&tiles.some(t=>t.id===v)),current=state.current===id?(previous.at(-1)??tiles[0].id):state.current;
 if(previous.at(-1)!==current)previous.push(current);return{...state,tiles,current,trail:[...previous,...future],cursor:previous.length-1};
}
