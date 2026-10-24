// Hue runs clockwise from red at the top; radius runs from soft to rich.
export function colorWheelPoint(x:number,y:number,size:number,fallbackHue=210){
 const radius=Math.max(1,size/2),dx=x-radius,dy=y-radius,distance=Math.hypot(dx,dy)/radius;
 return {hue:distance<.02?fallbackHue:(Math.atan2(dx,-dy)*180/Math.PI+360)%360,softness:1-Math.min(1,distance)};
}
export function colorWheelMarker(hue:number,softness:number){const angle=hue*Math.PI/180,radius=(1-Math.max(0,Math.min(1,softness)))*46;return {x:50+Math.sin(angle)*radius,y:50-Math.cos(angle)*radius};}
