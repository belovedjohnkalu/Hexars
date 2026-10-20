import { gameCloudLayout } from './gameCloudLayout';
describe('Responsive game cloud',()=>{
 it('keeps short landscape boards and action targets within the visible world',()=>{
  for(const [width,height] of [[852,235],[568,162],[1280,380]])for(const aspect of [1.735,1.49,.884]){const r=gameCloudLayout(width,height,aspect);expect(r.worldHeight).toBe(Math.max(height,208));expect(r.boardY).toBeGreaterThanOrEqual(0);expect(r.boardY+r.boardHeight).toBeLessThanOrEqual(r.worldHeight);for(const a of Object.values(r.actions)){expect(a.top-22).toBeGreaterThanOrEqual(0);expect(a.top+22).toBeLessThanOrEqual(r.worldHeight);expect(a.left).toBeGreaterThan(70);expect(a.left).toBeLessThan(width-70);}}
 });
 it('includes complete action hit targets on short portrait screens',()=>{for(const [w,h] of [[320,390],[390,540],[430,650]])for(const aspect of [.884,1.49,1.735]){const r=gameCloudLayout(w,h,aspect);for(const action of Object.values(r.actions)){expect(action.top-22).toBeGreaterThanOrEqual(0);expect(action.top+22).toBeLessThanOrEqual(r.worldHeight);}}});
 it('retains the large portrait board and surrounding words',()=>{const r=gameCloudLayout(393,620,1.735);expect(r.boardWidth).toBe(369);expect(r.actions.variants.top).toBeLessThan(r.boardY);expect(r.actions.reset.top).toBeGreaterThan(r.boardY+r.boardHeight);expect(r.actions.reset.top-r.actions.engines.top).toBeGreaterThan(51.9);expect(r.actions.online.top-r.actions.variants.top).toBeGreaterThan(51.9);});
});
