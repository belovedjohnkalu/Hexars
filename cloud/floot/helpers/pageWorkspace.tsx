export type PageDirection='left'|'right'|'up'|'down';
export type PageTree={screen:number}|{axis:'x'|'y';ratio:number;first:PageTree;second:PageTree};
export type PageTile={id:number;x:number;y:number;width:number;height:number};
export type PageDivider={id:string;x1:number;y1:number;x2:number;y2:number};
export function pageScreenIds(tree:PageTree):number[]{return 'screen'in tree?[tree.screen]:[...pageScreenIds(tree.first),...pageScreenIds(tree.second)];}
export function splitPage(tree:PageTree,screen:number,id:number,direction:PageDirection):PageTree{
 if('screen'in tree){if(tree.screen!==screen)return tree;const before=direction==='left'||direction==='up';return{axis:direction==='left'||direction==='right'?'x':'y',ratio:.5,first:{screen:before?id:screen},second:{screen:before?screen:id}};}
 return{...tree,first:splitPage(tree.first,screen,id,direction),second:splitPage(tree.second,screen,id,direction)};
}
export function removePage(tree:PageTree,screen:number):PageTree|null{
 if('screen'in tree)return tree.screen===screen?null:tree;
 const first=removePage(tree.first,screen),second=removePage(tree.second,screen);return !first?second:!second?first:{...tree,first,second};
}
export function movePage(tree:PageTree,screen:number,target:number,direction:PageDirection):PageTree{
 if(screen===target||!pageScreenIds(tree).includes(target)||!pageScreenIds(tree).includes(screen))return tree;
 const rest=removePage(tree,screen);return rest?splitPage(rest,target,screen,direction):tree;
}
export function pageGeometry(tree:PageTree,width:number,height:number){
 const tiles:PageTile[]=[],dividers:PageDivider[]=[];
 function visit(node:PageTree,x:number,y:number,w:number,h:number,path:string){
  if('screen'in node){tiles.push({id:node.screen,x,y,width:w,height:h});return;}
  const ratio=Math.max(.15,Math.min(.85,node.ratio));
  if(node.axis==='x'){const cut=w*ratio;visit(node.first,x,y,cut,h,path+'a');visit(node.second,x+cut,y,w-cut,h,path+'b');dividers.push({id:path,x1:x+cut,y1:y+Math.min(24,h/4),x2:x+cut,y2:y+h-Math.min(24,h/4)});}
  else{const cut=h*ratio;visit(node.first,x,y,w,cut,path+'a');visit(node.second,x,y+cut,w,h-cut,path+'b');dividers.push({id:path,x1:x+Math.min(24,w/4),y1:y+cut,x2:x+w-Math.min(24,w/4),y2:y+cut});}
 }
 visit(tree,0,0,width,height,'cut');return{tiles,dividers};
}
// Keyboard splits use the longest side. The first desktop split is left/right.
export function pageLayout(count:number,width:number,height:number){
 let tree:PageTree={screen:0};for(let id=1;id<count;id++){const largest=pageGeometry(tree,width,height).tiles.reduce((a,b)=>a.width*a.height>=b.width*b.height?a:b);tree=splitPage(tree,largest.id,id,id===1||largest.width>=largest.height?'right':'down');}return pageGeometry(tree,width,height);
}
export function adjacentPage(tiles:PageTile[],id:number,direction:PageDirection){
 const from=tiles.find(t=>t.id===id);if(!from)return id;const horizontal=direction==='left'||direction==='right',sign=direction==='left'||direction==='up'?-1:1,cx=from.x+from.width/2,cy=from.y+from.height/2;
 const candidates=tiles.filter(t=>t.id!==id).map(t=>{const dx=t.x+t.width/2-cx,dy=t.y+t.height/2-cy,along=(horizontal?dx:dy)*sign,cross=Math.abs(horizontal?dy:dx);return{t,along,score:along+cross*2};}).filter(t=>t.along>1).sort((a,b)=>a.score-b.score);if(candidates[0])return candidates[0].t.id;if(horizontal&&tiles.length>1){const index=tiles.findIndex(t=>t.id===id);return tiles[(index+(sign>0?1:tiles.length-1))%tiles.length].id;}return id;
}
export function pageFocusEdges(tile:PageTile,width:number,height:number):PageDivider[]{
 const lines:PageDivider[]=[],vertical=height>=width,pad=22;
 if(vertical){if(tile.x<1)lines.push({id:'focus-left',x1:7,y1:tile.y+pad,x2:7,y2:tile.y+tile.height-pad});if(tile.x+tile.width>width-1)lines.push({id:'focus-right',x1:width-7,y1:tile.y+pad,x2:width-7,y2:tile.y+tile.height-pad});}
 else{if(tile.y<1)lines.push({id:'focus-top',x1:tile.x+pad,y1:7,x2:tile.x+tile.width-pad,y2:7});if(tile.y+tile.height>height-1)lines.push({id:'focus-bottom',x1:tile.x+pad,y1:height-7,x2:tile.x+tile.width-pad,y2:height-7});}return lines;
}
export function pageKeyTarget(event:KeyboardEvent){
 if(event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||event.altKey||event.shiftKey)return false;
 const target=event.target instanceof Element?event.target:null;
 if(target?.closest('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[role="combobox"],[role="slider"],[role="spinbutton"],[role="tablist"],[data-cell],[data-no-navigation-keys]'))return false;
 const editor=target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
 return !editor||editor instanceof HTMLInputElement&&editor.matches('[data-cloud-input]')&&editor.value===''&&!editor.readOnly&&!editor.disabled;
}
export function pageKey(event:KeyboardEvent){return !event.ctrlKey&&!event.metaKey&&pageKeyTarget(event)&&['ArrowUp','ArrowDown'].includes(event.key)?event.key==='ArrowUp'?1:-1:0;}
export function isPagePane(){try{return window.parent!==window&&window.name.startsWith('ion-page-')&&window.parent.location.origin===window.location.origin;}catch{return false;}}
