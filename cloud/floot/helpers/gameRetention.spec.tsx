import { savedGameExpired,SAVED_GAME_DAYS } from './gameRetention';
describe('Permanent saved games',()=>{it('keeps old and recent positions without an expiry boundary',()=>{expect(SAVED_GAME_DAYS).toBeNull();expect(savedGameExpired('2000-01-01')).toBeFalse();expect(savedGameExpired(new Date())).toBeFalse();});});
