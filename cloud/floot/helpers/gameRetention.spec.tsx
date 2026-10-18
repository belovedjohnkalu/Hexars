import { savedGameCutoff,savedGameExpired } from './gameRetention';
describe('Thirty-day saved chess retention',()=>{
 const now=new Date('2026-10-18T12:00:00Z');
 it('uses thirty full days since the last save, including the exact boundary',()=>{expect(savedGameCutoff(now).toISOString()).toBe('2026-09-18T12:00:00.000Z');expect(savedGameExpired('2026-09-18T12:00:00Z',now)).toBeTrue();expect(savedGameExpired('2026-09-18T12:00:00.001Z',now)).toBeFalse();});
 it('keeps recent saves across calendar and year boundaries',()=>{const year=new Date('2027-01-10T03:00:00Z');expect(savedGameCutoff(year).toISOString()).toBe('2026-12-11T03:00:00.000Z');expect(savedGameExpired('2027-01-09T00:00:00Z',year)).toBeFalse();});
});
