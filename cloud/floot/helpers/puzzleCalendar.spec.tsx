import {puzzleCalendar,dailyPuzzleIndex} from './puzzleCalendar';
describe('Daily puzzle boundaries',()=>{
 it('follows the account date across devices rather than the server calendar',()=>{const now=new Date('2026-10-27T02:00:00Z');expect(puzzleCalendar('America/New_York',now).day).toBe('2026-10-26');expect(puzzleCalendar('Asia/Tokyo',now).day).toBe('2026-10-27');});
 it('refreshes once at the next local midnight, including daylight saving',()=>{for(const [zone,now,next]of[['UTC','2026-10-27T12:00:00Z','2026-10-28T00:00:00Z'],['America/New_York','2026-11-01T04:30:00Z','2026-11-02T05:00:00Z']]){const value=puzzleCalendar(zone,new Date(now));expect(Math.abs(Date.parse(value.expiresAt)-Date.parse(next))).toBeLessThan(2100);}});
 it('chooses a different verified question each day through the complete bank',()=>{const ids=Array.from({length:64},(_,i)=>dailyPuzzleIndex(20000+i,64,'glinski'));expect(new Set(ids).size).toBe(64);expect(dailyPuzzleIndex(20000,64,'glinski')).toBe(dailyPuzzleIndex(20000,64,'glinski'));});
});
