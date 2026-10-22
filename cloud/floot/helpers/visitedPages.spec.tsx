import {recordVisitedPage,previousPageStep,safeBackTarget} from './visitedPages';
describe('Back without Controls',()=>{
 it('skips one or more Controls visits and follows the actual preceding page',()=>{recordVisitedPage(0,'/');recordVisitedPage(1,'/?cloud=private');recordVisitedPage(2,'/?cloud=controls&selected=b');recordVisitedPage(3,'/?cloud=controls&selected=a');recordVisitedPage(4,'/?cloud=private');expect(previousPageStep(4)).toBe(-4);expect(previousPageStep(2)).toBe(-1);});
 it('retains deliberate Controls visits in history',()=>{recordVisitedPage(0,'/',true);recordVisitedPage(1,'/?cloud=controls&space=home',true);recordVisitedPage(2,'/?cloud=settings&space=home',true);expect(previousPageStep(2)).toBe(-1);expect(safeBackTarget('/?cloud=controls&space=home')).toBe('/?cloud=controls&space=home');});
 it('removes abandoned forward entries and refuses unknown history',()=>{recordVisitedPage(1,'/?cloud=public',true);expect(previousPageStep(4)).toBe(0);expect(previousPageStep(1)).toBe(-1);});
 it('cleans Controls fallbacks without following external origins',()=>{expect(safeBackTarget('/?cloud=controls&origin='+encodeURIComponent('/?cloud=private'))).toBe('/?cloud=private');expect(safeBackTarget('/?cloud=controls&origin=https://elsewhere.test')).toBe('/');expect(safeBackTarget('//elsewhere.test')).toBe('/');expect(safeBackTarget('/\\elsewhere.test')).toBe('/');});
});
