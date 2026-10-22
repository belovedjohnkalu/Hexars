import { resumeCloudTyping } from './resumeCloudTyping';
describe('Resume interrupted typing',()=>{
 let input:HTMLInputElement,cleanup:()=>void;
 beforeEach(()=>{input=document.createElement('input');input.value='An unfinished word';document.body.append(input);cleanup=resumeCloudTyping(input);});
 afterEach(()=>{cleanup();input.remove();});
 it('restores an active draft and caret after returning from the background',()=>{input.focus();input.setSelectionRange(3,8);window.dispatchEvent(new window.Event('blur'));input.blur();window.dispatchEvent(new window.Event('focus'));expect(document.activeElement).toBe(input);expect(input.value).toBe('An unfinished word');expect(input.selectionStart).toBe(3);expect(input.selectionEnd).toBe(8);});
 it('does not steal focus from another control or open a fresh keyboard',()=>{window.dispatchEvent(new window.Event('focus'));expect(document.activeElement).not.toBe(input);input.focus();const button=document.createElement('button');document.body.append(button);button.focus();window.dispatchEvent(new window.Event('focus'));expect(document.activeElement).toBe(button);button.remove();});
 it('does not refocus through a dialog and removes its listeners on unmount',()=>{input.focus();window.dispatchEvent(new window.Event('blur'));const dialog=document.createElement('div');dialog.setAttribute('role','dialog');document.body.append(dialog);input.blur();window.dispatchEvent(new window.Event('focus'));expect(document.activeElement).not.toBe(input);dialog.remove();cleanup();window.dispatchEvent(new window.Event('focus'));expect(document.activeElement).not.toBe(input);});
});
