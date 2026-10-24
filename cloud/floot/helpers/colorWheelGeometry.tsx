// Horizontal position selects hue; distance from the middle selects richness.
export function colorWheelPoint(x:number,y:number,width:number,height:number){
 const middle=Math.max(1,height/2);
 return {hue:Math.max(0,Math.min(359.99,x/Math.max(1,width)*360)),softness:1-Math.min(1,Math.abs(y-middle)/middle)};
}
export function colorWheelMarker(hue:number,softness:number,side=-1){return {x:Math.max(3,Math.min(97,hue/360*100)),y:50+side*(1-Math.max(0,Math.min(1,softness)))*40};}
