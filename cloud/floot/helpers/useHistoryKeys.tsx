import {recordVisitedPage,previousPageStep} from './visitedPages';
import { useEffect,useLayoutEffect,useRef } from 'react';
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
 const location=useLocation(),kind=useNavigationType(),navigate=useNavigate(),ceiling=useRef(Number(window.history.state?.idx)||0);
 useLayoutEffect(()=>{const index=Number(window.history.state?.idx)||0;recordVisitedPage(index,location.pathname+location.search+location.hash,kind==='PUSH');ceiling.current=kind==='PUSH'?index:Math.max(ceiling.current,index);},[location.key,kind]);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{const step=historyKey(event),index=Number(window.history.state?.idx)||0;if(!step||step<0&&index<=0||step>0&&index>=ceiling.current)return;event.preventDefault();if(step<0){const back=previousPageStep(index);if(back)navigate(back);else navigate('/',{replace:true});}else navigate(step);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[navigate]);
}
