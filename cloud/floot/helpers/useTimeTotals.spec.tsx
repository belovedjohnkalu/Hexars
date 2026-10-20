import { pendingTime,timeClock } from './useTimeTotals';
import type { TimeSnapshot } from '../endpoints/time_POST.schema';
describe('Live Time presentation',()=>{
 const start=Date.parse('2026-10-20T10:00:00Z'),snapshot={observedAt:new Date(start+100).toISOString(),earning:{active:true,lastSeen:new Date(start).toISOString(),idleUntil:new Date(start+180000).toISOString(),leaseId:'test'}} as TimeSnapshot;
 it('adds only the current server-bounded pending interval',()=>{expect(pendingTime(snapshot,1900,true)).toBe(2000000n);expect(pendingTime(snapshot,1900,false)).toBe(0n);expect(pendingTime(null,1000,true)).toBe(0n);expect(pendingTime(snapshot,31000,true)).toBe(0n);const idle={...snapshot,earning:{...snapshot.earning!,idleUntil:new Date(start+3000).toISOString()}};expect(pendingTime(idle,5000,true)).toBe(3000000n);});
 it('formats running totals without floating point or a 24-hour wrap',()=>{expect(timeClock('0')).toBe('00:00:00');expect(timeClock('3661000000')).toBe('01:01:01');expect(timeClock('90000000000')).toBe('25:00:00');expect(timeClock('100000000000000000')).toBe('27777777:46:40');});
});
