import {readPageHistory,pushPageHistory,stepPageHistory,pageHistoryTarget,type PageHistory} from './pageHistory';
import {safePageURL} from './pageURL';
export type PaneNavigation={key:string;history:PageHistory};
let current:PaneNavigation|null=null,version=0,lastBrowserIndex=0;const listeners=new Set<()=>void>();
function notify(){version++;for(const listener of listeners)listener();if(current)window.dispatchEvent(new window.CustomEvent('ion.pane-history',{detail:{key:current.key,history:current.history}}));}
function stamp(){if(!current||typeof window==='undefined')return;const path=location.pathname+location.search+location.hash;if(path!==current.history.entries[current.history.cursor])return;window.history.replaceState({...window.history.state,ionPaneKey:current.key,ionPaneCursor:current.history.cursor},'',window.location.href);lastBrowserIndex=Number(window.history.state?.idx)||0;}
export const paneNavigation={
 get:()=>current,version:()=>version,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
 set(key:string,history:unknown,url:string,force=false){if(current?.key===key&&!force)return;current={key,history:readPageHistory(history,url)};stamp();notify();},
 clear(){if(!current)return;current=null;notify();},
 record(url:string,kind:string){if(!current||!safePageURL(url))return null;const browser=window.history.state||{},index=Number(browser.idx)||0,old=current.history;
  if(kind==='POP'&&browser.ionPaneKey&&browser.ionPaneKey!==current.key){const h=stepPageHistory(old,index<lastBrowserIndex?-1:1);current={...current,history:h};lastBrowserIndex=index;notify();return h.entries[h.cursor]===url?null:h.entries[h.cursor];}
  if(kind==='POP'&&browser.ionPaneKey===current.key&&Number.isSafeInteger(browser.ionPaneCursor)&&old.entries[browser.ionPaneCursor]===url){const h={...old,cursor:browser.ionPaneCursor,...(browser.ionPaneCursor<old.cursor?{returns:{...old.returns,[browser.ionPaneCursor]:old.cursor}}:{})};current={...current,history:h};}
  else current={...current,history:pushPageHistory(old,url,kind==='REPLACE')};
  stamp();if(current.history!==old)notify();return null;
 },
 can(step:1|-1){return !!current&&pageHistoryTarget(current.history,step)!==null;},
 step(step:1|-1){if(!current)return null;const next=stepPageHistory(current.history,step);if(next===current.history)return null;current={...current,history:next};notify();return next.entries[next.cursor];},
};
