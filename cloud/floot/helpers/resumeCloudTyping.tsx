// Restore an interrupted typing session, never open a keyboard for a new visitor.
export function resumeCloudTyping(input:HTMLInputElement){
 let focused=document.activeElement===input,suspended=false,start:number|null=null,end:number|null=null;
 const remember=()=>{if(!focused&&document.activeElement!==input)return;suspended=true;start=input.selectionStart;end=input.selectionEnd;};
 const resume=()=>{if(!suspended||document.hidden)return;suspended=false;if(!input.isConnected||input.disabled||input.readOnly||document.querySelector('[role="dialog"],[role="alertdialog"]'))return;input.focus({preventScroll:true});if(start!==null&&end!==null)input.setSelectionRange(start,end);};
 const focus=()=>{focused=true;};
 const blur=()=>{if(suspended||document.hidden||!document.hasFocus())remember();else{focused=false;suspended=false;}};
 const visibility=()=>{if(document.hidden)remember();else resume();};
 const otherFocus=(event:FocusEvent)=>{if(event.target!==input){focused=false;suspended=false;}};
 input.addEventListener('focus',focus);input.addEventListener('blur',blur);document.addEventListener('focusin',otherFocus);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',remember);window.addEventListener('focus',resume);window.addEventListener('pagehide',remember);window.addEventListener('pageshow',resume);
 return()=>{input.removeEventListener('focus',focus);input.removeEventListener('blur',blur);document.removeEventListener('focusin',otherFocus);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',remember);window.removeEventListener('focus',resume);window.removeEventListener('pagehide',remember);window.removeEventListener('pageshow',resume);};
}
