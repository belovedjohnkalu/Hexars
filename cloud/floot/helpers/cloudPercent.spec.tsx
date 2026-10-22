import { cloudPercent } from './cloudPercent';
describe('Precise descendant-character scale',()=>{
 it('keeps sixteen decimal places without intermediate floating-point rounding',()=>{expect(cloudPercent(1,0,3).exact).toBe('33.3333333333333333');expect(cloudPercent(2,0,3).exact).toBe('66.6666666666666666');expect(cloudPercent(5,5,8).exact).toBe('0.0000000000000000');expect(cloudPercent(8,5,8).exact).toBe('100.0000000000000000');});
 it('gives equal weights one stable midpoint',()=>{expect(cloudPercent(0,0,0)).toEqual({value:50,exact:'50.0000000000000000'});});
});
