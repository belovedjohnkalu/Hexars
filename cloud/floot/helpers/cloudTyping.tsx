export function desktopTyping(){return typeof window.matchMedia==='function'&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;}
export function focusCloudComposer(){
 if(!desktopTyping()||document.querySelector('[role="dialog"],[role="alertdialog"]'))return false;
 const input=document.querySelector<HTMLInputElement>('#cloud-composer-form input[data-cloud-input]');
 if(!input||input.disabled||input.readOnly)return false;
 input.focus({preventScroll:true});return true;
}
