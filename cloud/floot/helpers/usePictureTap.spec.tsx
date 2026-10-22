import { renderHook,act } from '@testing-library/react';
import { usePictureTap,PICTURE_DOUBLE_TAP_MS } from './usePictureTap';
import type { MouseEvent } from 'react';
function event(detail=1){const target=document.createElement('span');target.dataset.photoCount='1';return {detail,button:0,target,preventDefault:()=>{},stopPropagation:()=>{}} as unknown as MouseEvent<HTMLElement>;}
const node={id:'photo',parentId:'ion',name:'Photo',imageUrl:'/picture.png'};
describe('Picture double tap',()=>{
 beforeEach(()=>jasmine.clock().install());afterEach(()=>jasmine.clock().uninstall());
 it('opens fullscreen on the second tap without navigating',()=>{const hook=renderHook(()=>usePictureTap()),single=jasmine.createSpy('single');act(()=>{hook.result.current.click(event(),node,single);jasmine.clock().tick(100);hook.result.current.click(event(2),node,single);jasmine.clock().tick(PICTURE_DOUBLE_TAP_MS);});expect(single).not.toHaveBeenCalled();expect(hook.result.current.viewing?.id).toBe('photo');act(()=>hook.result.current.close());expect(hook.result.current.viewing).toBeNull();hook.unmount();});
 it('keeps single tap navigation and cancels timers on unmount',()=>{const hook=renderHook(()=>usePictureTap()),single=jasmine.createSpy('single');act(()=>{hook.result.current.click(event(),node,single);jasmine.clock().tick(PICTURE_DOUBLE_TAP_MS);});expect(single).toHaveBeenCalledTimes(1);act(()=>{hook.result.current.click(event(),node,single);});hook.unmount();jasmine.clock().tick(PICTURE_DOUBLE_TAP_MS);expect(single).toHaveBeenCalledTimes(1);});
 it('leaves keyboard, modified clicks and locked previews alone',()=>{const hook=renderHook(()=>usePictureTap());expect(hook.result.current.click(event(0),node,()=>{})).toBeFalse();expect(hook.result.current.click(event(),{...node,lockedItem:'paid'},()=>{})).toBeFalse();hook.unmount();});
});
