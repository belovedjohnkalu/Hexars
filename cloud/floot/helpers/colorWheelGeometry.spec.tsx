import {colorWheelPoint,colorWheelMarker} from './colorWheelGeometry';
describe('Single color wheel',()=>{
 it('uses angle for hue and radius for softness, clamping drags outside',()=>{expect(colorWheelPoint(50,0,100).hue).toBe(0);expect(colorWheelPoint(100,50,100).hue).toBe(90);expect(colorWheelPoint(50,100,100).hue).toBe(180);expect(colorWheelPoint(0,50,100).hue).toBe(270);expect(colorWheelPoint(50,50,100,42)).toEqual({hue:42,softness:1});expect(colorWheelPoint(200,50,100).softness).toBe(0);expect(colorWheelPoint(50,25,100).softness).toBe(.5);});
 it('keeps the marker within the rim and centers soft colors',()=>{expect(colorWheelMarker(0,1)).toEqual({x:50,y:50});for(let h=0;h<360;h+=10){const p=colorWheelMarker(h,0);expect(Math.hypot(p.x-50,p.y-50)).toBeLessThanOrEqual(46.00001);}});
});
