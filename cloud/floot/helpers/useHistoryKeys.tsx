import {recordVisitedPage,previousPageStep,nextPageStep} from './visitedPages';
import { useEffect,useLayoutEffect } from 'react';
import { useLocation,useNavigate,useNavigationType } from 'react-router-dom';
export function historyKey(event:KeyboardEvent):number{
 if(event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return 0;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return 0;
 const target=event.target instanceof Element?event.target:null;
 if(target?.closest('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[role="combobox"],[role="slider"],[role="spinbutton"],[role="tablist"],[data-cell],[data-no-navigation-keys]'))return 0;
 const editor=target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
 if(editor&&!(editor instanceof HTMLInputElement&&editor.matches('[data-cloud-input]')&&editor.value===''&&!editor.readOnly&&!editor.disabled))return 0;
 return event.key==='ArrowLeft'?-1:1;
}
export function useHistoryKeys(){
 const location=useLocation(),kind=useNavigationType(),navigate=useNavigate();
 useLayoutEffect(()=>{const index=Number(window.history.state?.idx)||0;let entry=window.history.state?.ionVisitKey;if(typeof entry!=='string'){entry=crypto.randomUUID();window.history.replaceState({...window.history.state,ionVisitKey:entry},'',window.location.href);}recordVisitedPage(index,location.pathname+location.search+location.hash,kind==='PUSH',entry);},[location.key,kind]);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{const step=historyKey(event),index=Number(window.history.state?.idx)||0;if(!step||step<0&&index<=0||step>0&&!nextPageStep(index))return;event.preventDefault();if(step<0){const back=previousPageStep(index);if(back)navigate(back);else navigate('/',{replace:true});}else{const forward=nextPageStep(index);if(forward)navigate(forward);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[navigate]);
}
