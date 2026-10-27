import {renderHook,act} from '@testing-library/react';
import {useAppearance,AppearanceSync,toggleAppearance,appearanceChrome,setDarkAppearance} from './useAppearance';
describe('Light-only app appearance',()=>{
 afterEach(()=>{localStorage.removeItem('ion.appearance.dark');});
 it('clears an earlier dark preference and keeps every attempted change light',()=>{localStorage.setItem('ion.appearance.dark','true');const sync=renderHook(()=>AppearanceSync()),hook=renderHook(()=>useAppearance());expect(hook.result.current.dark).toBeFalse();expect(document.documentElement.dataset.ionTheme).toBe('light');expect(localStorage.getItem('ion.appearance.dark')).toBeNull();act(()=>toggleAppearance());act(()=>setDarkAppearance(true));expect(document.documentElement.dataset.ionTheme).toBe('light');expect(document.body.classList.contains('dark')).toBeFalse();expect(appearanceChrome(true).colorScheme).toBe('light');sync.unmount();hook.unmount();});
 it('stays light when browser storage is blocked',()=>{const blocked=spyOn(Storage.prototype,'removeItem').and.throwError('Blocked');expect(()=>setDarkAppearance(true)).not.toThrow();expect(document.documentElement.style.colorScheme).toBe('light');blocked.and.callThrough();});
});
