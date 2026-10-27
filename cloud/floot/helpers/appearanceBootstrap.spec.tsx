import {runInNewContext} from 'node:vm';
import {appearanceBootstrap,applyAppearance} from './useAppearance';
describe('Theme before the app loads',()=>{
 let attributes:string,head:string,body:string;
 beforeEach(()=>{attributes=document.documentElement.getAttribute('style')||'';head=document.head.innerHTML;body=document.body.className;document.head.innerHTML='<meta name="theme-color" content="#fafaf9"><meta name="color-scheme" content="light">';});
 afterEach(()=>{document.documentElement.setAttribute('style',attributes);delete document.documentElement.dataset.ionTheme;delete document.documentElement.dataset.ionInverted;document.head.innerHTML=head;document.body.className=body;});
 it('restores saved dark paint and browser chrome before React or CSS is available',()=>{runInNewContext(appearanceBootstrap,{document,localStorage:{getItem:()=> 'true'}});expect(document.documentElement.dataset.ionTheme).toBe('dark');expect(document.documentElement.style.backgroundColor).toBe('rgb(8, 9, 11)');expect(document.documentElement.style.colorScheme).toBe('dark');expect(document.querySelector('meta[name=theme-color]')?.getAttribute('content')).toBe('#08090b');});
 it('retains the light default when no preference can be read',()=>{for(const getItem of[()=>null,()=>{throw Error('Storage unavailable');}]){runInNewContext(appearanceBootstrap,{document,localStorage:{getItem}});expect(document.documentElement.dataset.ionTheme).toBe('light');expect(document.documentElement.style.backgroundColor).toBe('rgb(250, 250, 249)');}});
 it('updates the inline canvas when the user switches themes later',()=>{applyAppearance(true);applyAppearance(false);expect(document.documentElement.style.backgroundColor).toBe('rgb(250, 250, 249)');expect(document.documentElement.style.colorScheme).toBe('light');expect(document.body.classList.contains('dark')).toBeFalse();});
});
