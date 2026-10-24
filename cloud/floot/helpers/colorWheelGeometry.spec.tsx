import {colorWheelPoint,colorWheelMarker} from './colorWheelGeometry';
describe('Horizontal color box',()=>{
 it('selects hues horizontally and softens toward the middle',()=>{expect(colorWheelPoint(0,0,300,80)).toEqual({hue:0,softness:0});expect(colorWheelPoint(150,40,300,80)).toEqual({hue:180,softness:1});expect(colorWheelPoint(150,20,300,80)).toEqual({hue:180,softness:.5});expect(colorWheelPoint(150,60,300,80)).toEqual({hue:180,softness:.5});expect(colorWheelPoint(150,80,300,80).softness).toBe(0);expect(colorWheelPoint(-20,-30,300,80)).toEqual({hue:0,softness:0});expect(colorWheelPoint(400,100,300,80).hue).toBe(359.99);});
 it('keeps the marker inside the rounded edges and remembers the selected half',()=>{expect(colorWheelMarker(180,1)).toEqual({x:50,y:50});expect(colorWheelMarker(180,0,-1)).toEqual({x:50,y:10});expect(colorWheelMarker(180,0,1)).toEqual({x:50,y:90});expect(colorWheelMarker(0,0).x).toBe(3);expect(colorWheelMarker(360,0).x).toBe(97);});
});
