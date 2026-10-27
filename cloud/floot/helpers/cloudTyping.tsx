export function desktopTyping(){return typeof window.matchMedia==='function'&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;}
export function activeCloudScreen(){
 if(window.name.startsWith('ion-page-')&&window.parent!==window){try{return window.parent.document.querySelector('[data-page-count]')?.getAttribute('data-active-screen')===window.name.slice('ion-page-'.length);}catch{return false;}}
 return document.documentElement.dataset.ionScreenActive!=='false';
}
export function focusCloudComposer(){
 if(!desktopTyping()||!activeCloudScreen()||document.querySelector('[role="dialog"],[role="alertdialog"]'))return false;
 const input=document.querySelector<HTMLInputElement>('#cloud-composer-form input[data-cloud-input]');
 if(!input||input.disabled||input.readOnly)return false;
 input.focus({preventScroll:true});return true;
}
