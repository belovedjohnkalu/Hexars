// Fixed seed anchors never depend on response order or descendant counts.
export function cloudHomeLayout(width:number,height:number){
 const narrow=width<600,picture=narrow?118:148,h=Math.max(height,narrow?560:420),wordWidth=narrow?150:190;
 const image=(id:string,x:number,y:number)=>({id,x:x-(picture+24)/2,y:y-picture/2,width:picture+24,height:picture+58,fontSize:20});
 return {width,height:h,items:[image('hexagonal-chess',width/2,h*.2),{id:'public',x:width*.26-wordWidth/2,y:h*.48-28,width:wordWidth,height:56,fontSize:23},{id:'private',x:width*.74-wordWidth/2,y:h*.48-28,width:wordWidth,height:56,fontSize:23},image('controls',width*.26,h*.75),image('accounts',width*.74,h*.75)]};
}
