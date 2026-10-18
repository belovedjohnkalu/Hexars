// Keep the board large on short, wide screens, with actions beside it.
// Content-only changes do not refit the user's spatial camera.
export function gameCloudLayout(width:number,height:number,aspect:number){
 const landscape=width>height*1.6&&height<420;
 const boardWidth=Math.min(width-24,540,...(landscape?[Math.max(60,height-12)*aspect]:[]));
 const boardHeight=boardWidth/aspect,worldWidth=Math.max(width,boardWidth+24),worldHeight=landscape?height:Math.max(height,boardHeight+160),boardY=(worldHeight-boardHeight)/2;
 const left=(worldWidth-boardWidth)/4,right=worldWidth-left;
 const at=(side:'left'|'right',row:0|1|2)=>({left:landscape?(side==='left'?left:right):worldWidth*([[.2,.72],[.28,.72],[.2,.78]][row][side==='left'?0:1]),top:landscape?worldHeight*[.18,.5,.82][row]:boardY+(row===0?-42:boardHeight+(row===1?34:76))});
 return {boardWidth,boardHeight,worldWidth,worldHeight,boardY,actions:{variants:at('left',0),rules:at('right',0),engines:at('left',1),friend:at('right',1),reset:at('left',2),undo:at('right',2)}};
}
