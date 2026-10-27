import {runInNewContext} from 'node:vm';
import {appearanceBootstrap,applyAppearance} from './useAppearance';
describe('Light appearance before app hydration',()=>{
 let attributes:string,head:string,body:string;
 beforeEach(()=>{attributes=document.documentElement.getAttribute('style')||'';head=document.head.innerHTML;body=document.body.className;document.head.innerHTML='<meta name="theme-color" content="#000"><meta name="color-scheme" content="dark">';});
 afterEach(()=>{document.documentElement.setAttribute('style',attributes);delete document.documentElement.dataset.ionTheme;delete document.documentElement.dataset.ionInverted;document.head.innerHTML=head;document.body.className=body;});
 it('clears a saved dark setting and sets browser chrome before React or CSS',()=>{const remove=jasmine.createSpy('remove');runInNewContext(appearanceBootstrap,{document,localStorage:{removeItem:remove}});expect(remove).toHaveBeenCalledWith('ion.appearance.dark');expect(document.documentElement.dataset.ionTheme).toBe('light');expect(document.documentElement.style.backgroundColor).toBe('rgb(250, 250, 249)');expect(document.querySelector('meta[name=theme-color]')?.getAttribute('content')).toBe('#fafaf9');});
 it('stays light when storage throws or an old caller asks for dark',()=>{runInNewContext(appearanceBootstrap,{document,localStorage:{removeItem:()=>{throw Error('Blocked');}}});applyAppearance(true);expect(document.documentElement.dataset.ionTheme).toBe('light');expect(document.documentElement.style.colorScheme).toBe('light');expect(document.body.classList.contains('dark')).toBeFalse();});
});
