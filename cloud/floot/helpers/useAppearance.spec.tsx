import { renderHook,act } from '@testing-library/react';
import { useAppearance,AppearanceSync,toggleAppearance,appearanceChrome } from './useAppearance';
describe('App-wide inversion',()=>{
 afterEach(()=>{localStorage.removeItem('ion.appearance.inverted');document.documentElement.removeAttribute('data-ion-inverted');window.dispatchEvent(new window.Event('ion-appearance'));});
 it('matches Safari chrome to the actual visible theme without forcing a black status bar',()=>{expect(appearanceChrome(true)).toEqual({themeColor:'#ffffff',colorScheme:'light',statusBarStyle:'default'});expect(appearanceChrome(false)).toEqual({themeColor:'#000000',colorScheme:'dark',statusBarStyle:'default'});});
 it('toggles all surfaces, persists and reverts without changing default tokens',()=>{localStorage.removeItem('ion.appearance.inverted');const sync=renderHook(()=>AppearanceSync()),hook=renderHook(()=>useAppearance());expect(hook.result.current.inverted).toBeFalse();act(()=>toggleAppearance());expect(hook.result.current.inverted).toBeTrue();expect(document.documentElement.dataset.ionInverted).toBe('true');expect(localStorage.getItem('ion.appearance.inverted')).toBe('true');act(()=>toggleAppearance());expect(hook.result.current.inverted).toBeFalse();expect(document.documentElement.dataset.ionInverted).toBe('false');sync.unmount();hook.unmount();});
});
