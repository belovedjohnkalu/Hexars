export type PageTile={id:number;x:number;y:number;width:number;height:number};
export type PageDivider={id:string;x1:number;y1:number;x2:number;y2:number};
export function pageLayout(count:number,width:number,height:number){
 let tiles:PageTile[]=[{id:0,x:0,y:0,width,height}],dividers:PageDivider[]=[];
 if(count===2){tiles=[{id:0,x:0,y:0,width,height:height/2},{id:1,x:0,y:height/2,width,height:height/2}];dividers=[{id:'first',x1:24,y1:height/2,x2:width-24,y2:height/2}];}
 if(count>=3){const cut=width/1.61803398875;tiles=[{id:0,x:0,y:0,width:cut,height},{id:1,x:cut,y:0,width:width-cut,height:height/2},{id:2,x:cut,y:height/2,width:width-cut,height:height/2}];dividers=[{id:'spine',x1:cut,y1:24,x2:cut,y2:height-24},{id:'right',x1:cut+24,y1:height/2,x2:width-24,y2:height/2}];}
 for(let id=3;id<count;id++){
  const largest=tiles.reduce((a,b)=>a.width*a.height>=b.width*b.height?a:b),i=tiles.indexOf(largest),vertical=largest.width>=largest.height,cut=(vertical?largest.width:largest.height)/1.61803398875;
  tiles[i]={...largest,...(vertical?{width:cut}:{height:cut})};tiles.push({...largest,id,...(vertical?{x:largest.x+cut,width:largest.width-cut}:{y:largest.y+cut,height:largest.height-cut})});
  dividers.push(vertical?{id:'cut-'+id,x1:largest.x+cut,y1:largest.y+24,x2:largest.x+cut,y2:largest.y+largest.height-24}:{id:'cut-'+id,x1:largest.x+24,y1:largest.y+cut,x2:largest.x+largest.width-24,y2:largest.y+cut});
 }
 return {tiles,dividers};
}
export function pageKey(event:KeyboardEvent){
 if(event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowUp','ArrowDown'].includes(event.key))return 0;
 const target=event.target instanceof Element?event.target:null;
 if(target?.closest('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[role="combobox"],[role="slider"],[role="spinbutton"],[role="tablist"],[data-cell],[data-no-navigation-keys]'))return 0;
 const editor=target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
 if(editor&&!(editor instanceof HTMLInputElement&&editor.matches('[data-cloud-input]')&&editor.value===''&&!editor.readOnly&&!editor.disabled))return 0;
 return event.key==='ArrowUp'?1:-1;
}
export function isPagePane(){try{return window.parent!==window&&window.name.startsWith('ion-page-')&&window.parent.location.origin===window.location.origin;}catch{return false;}}
