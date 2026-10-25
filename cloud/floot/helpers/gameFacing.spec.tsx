import {gameFacing} from './gameFacing';
import {createCheckers} from './checkersRules';
describe('Variant board viewpoints',()=>{
 it('keeps Kruzno Black in the lower-left reference quadrant on Black’s turn',()=>{
  const black=createCheckers('kruzno').pieces.filter(p=>p.player===1);
  const center=black.reduce((sum,p)=>({x:sum.x+p.q,y:sum.y-(p.r+p.q/2)}),{x:0,y:0});
  expect(center.x).toBeLessThan(0);expect(center.y).toBeGreaterThan(0);
  expect(gameFacing('kruzno',1)).toBeFalse();expect(gameFacing('kruzno',0)).toBeFalse();
 });
 it('preserves explicit Kruzno flips without tying them to turns or engine sides',()=>{for(const player of [0,1]){expect(gameFacing('kruzno',player,1)).toBeTrue();expect(gameFacing('kruzno',player,2)).toBeFalse();}});
 it('retains alternating chess/HexDame and three-player Wellisch viewpoints',()=>{for(const variant of ['glinski','brusky','hexdame']){expect(gameFacing(variant,0)).toBeFalse();expect(gameFacing(variant,1)).toBeTrue();expect(gameFacing(variant,1,1)).toBeFalse();}expect(gameFacing('wellisch',2)).toBe(-240);expect(gameFacing('wellisch',2,1)).toBe(0);});
});
