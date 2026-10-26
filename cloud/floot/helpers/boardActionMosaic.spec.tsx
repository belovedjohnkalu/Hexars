import {gameActionMosaic} from './gameActionMosaic';
import {functionClouds} from './functionClouds';
import {isRetiredGameCloud,onlineGameAction} from './retiredGameClouds';
describe('Board-side cloud placement and retired controls',()=>{
 it('puts four complete action tiles on each side of a desktop board',()=>{const out=gameActionMosaic(1280,640,700,false,600),left=(1280-600)/2;expect(out.desktop).toBeTrue();for(const id of ['variants','rules','online','library']){const f=out.faces.get(id)!;expect(f.x).toBeGreaterThanOrEqual(0);expect(f.x+f.width).toBeLessThanOrEqual(left);}for(const id of ['engines','friend','reset','undo']){const f=out.faces.get(id)!;expect(f.x).toBeGreaterThanOrEqual(left+600);expect(f.x+f.width).toBeLessThanOrEqual(1280);}});
 it('retains top and bottom action groups on a phone',()=>{const out=gameActionMosaic(390,420,650);expect(out.desktop).toBeFalse();expect(out.faces.get('variants')!.y+out.faces.get('variants')!.height).toBeLessThan(out.boardY);expect(out.faces.get('engines')!.y).toBeGreaterThan(out.boardY+420);});
 it('keeps deleted HexDame identities retired, with independent online controls',()=>{expect(functionClouds.some(n=>isRetiredGameCloud(n.id))).toBeFalse();expect(isRetiredGameCloud('function-u1:game-hexdame-forfeit')).toBeTrue();expect(isRetiredGameCloud('game-hexdame-online-forfeit')).toBeFalse();expect(onlineGameAction('hexdame','draw')).toBe('online-draw');expect(functionClouds.some(n=>n.id==='game-hexdame-online-draw')).toBeTrue();});
});
